ui = true

storage "file" {
  path = "/openbao/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

api_addr = "http://0.0.0.0:8200"
cluster_addr = "https://127.0.0.1:8201"

# Enable KV secrets engine v2 by default
default_lease_ttl = "168h"
max_lease_ttl = "720h"

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}
