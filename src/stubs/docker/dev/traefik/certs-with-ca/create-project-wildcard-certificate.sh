#!/bin/bash

# Predefined passphrase for webid-localhost-CA.key
passphrase="planner poster silly blooming"

# Define the domain
domain="druid-container.localhost"

curl -s -o ./webid-localhost-CA.pem https://raw.githubusercontent.com/web-id-fr/web-id-localhost-ca/refs/heads/main/certs/webid-localhost-CA.pem
curl -s -o ./webid-localhost-CA.key https://raw.githubusercontent.com/web-id-fr/web-id-localhost-ca/refs/heads/main/certs/webid-localhost-CA.key

# Define file names based on the domain
key_file="${domain}.key"
csr_file="${domain}.csr"
ext_file="${domain}.ext"
crt_file="${domain}.crt"

# Generate the private key (without a passphrase)
openssl genrsa -out "$key_file" 2048
echo "Private key generated: $key_file"

# Generate the certificate signing request (CSR) using the config file
openssl req -new -key "$key_file" -out "$csr_file" -config "${domain}.csr.conf"
echo "CSR generated: $csr_file"

# Sign the certificate using the CA and generate the final certificate, passing the passphrase
openssl x509 -req -in "$csr_file" -CA ./webid-localhost-CA.pem -CAkey ./webid-localhost-CA.key \
-CAcreateserial -out "$crt_file" -days 825 -sha256 -extfile "$ext_file" \
-passin pass:"$passphrase"

echo "Certificate generated: $crt_file"

rm $csr_file
rm webid-localhost-CA.*
