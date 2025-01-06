if [ -n "$GA4_ID" ] && [ -n "$GA4_API_KEY" ]; then
    mkdir -p build/resources
    echo "Post-build: Adding resource file into build folder"
    cat <<EOF > build/resources/ga4
{
    "GA4_ID": "$GA4_ID",
    "GA4_API_KEY": "$GA4_API_KEY"
}
EOF
else
    echo "Post-build:Warning: GA4_ID and GA4_API_KEY are not set"
fi
