vcl 4.1;

import std;

backend default {
  .host = "web";
  .port = "80";
  .connect_timeout = 5s;
  .first_byte_timeout = 30s;
  .between_bytes_timeout = 10s;
}

# ACL for cache purging and banning
acl purge {
  "localhost";
  "127.0.0.1";
  "::1";
  "web";
  "172.16.0.0"/12;
  "192.168.0.0"/16;
  "10.0.0.0"/8;
}

sub vcl_recv {
  # Pipe novarnish.* requests directly to backend
  if (req.http.Host ~ "^novarnish\.") {
    return (pipe);
  }

  # Handle BAN request for Cache-Tags invalidation
  if (req.method == "BAN") {
    if (!client.ip ~ purge) {
      return (synth(405, "BAN not allowed from " + client.ip));
    }
    if (req.http.X-Cache-Tags) {
      ban("obj.http.X-Cache-Tags ~ " + req.http.X-Cache-Tags);
      return (synth(200, "Banned cache tags: " + req.http.X-Cache-Tags));
    }
    if (req.http.Purge-Cache-Tags) {
      ban("obj.http.X-Cache-Tags ~ " + req.http.Purge-Cache-Tags);
      return (synth(200, "Banned cache tags: " + req.http.Purge-Cache-Tags));
    }
    return (synth(400, "Missing X-Cache-Tags header for BAN"));
  }

  # Handle PURGE request for exact URI
  if (req.method == "PURGE") {
    if (!client.ip ~ purge) {
      return (synth(405, "PURGE not allowed from " + client.ip));
    }
    return (purge);
  }

  # Pass non-GET/HEAD requests
  if (req.method != "GET" && req.method != "HEAD") {
    return (pass);
  }

  # For Headless Wire API requests (/api/v1/wire/*), strip client cookies to guarantee caching
  if (req.url ~ "^/api/v1/wire/") {
    unset req.http.Cookie;
    return (hash);
  }

  # For other requests, pass if logged in session cookie exists
  if (req.http.Cookie ~ "SESS[a-z0-9]+") {
    return (pass);
  }

  return (hash);
}

sub vcl_backend_response {
  # Enable grace mode for stampede protection (serve stale while refreshing)
  set beresp.grace = 1h;
  set beresp.keep = 1h;

  # Cache API responses if Cache-Control permits
  if (bereq.url ~ "^/api/v1/wire/" && beresp.status == 200) {
    if (beresp.http.Cache-Control ~ "max-age") {
      # Retain beresp.ttl according to headers
    } else {
      set beresp.ttl = 60s;
    }
    # Ensure X-Cache-Tags is stored in object
    return (deliver);
  }

  # Ensure large wire breaking items are cached properly
  if (beresp.http.X-Cache-Tags) {
    # Keep X-Cache-Tags on backend object for banning
  }
}

sub vcl_deliver {
  # Add diagnostic cache headers
  if (obj.hits > 0) {
    set resp.http.X-Cache = "HIT";
    set resp.http.X-Cache-Hits = obj.hits;
  } else {
    set resp.http.X-Cache = "MISS";
  }

  # Add debug server identifier
  set resp.http.X-Powered-By = "PAP-Newsroom-Varnish/6.0 (Drupal 10 + Redis)";

  return (deliver);
}
