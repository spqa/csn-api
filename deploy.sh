#!/bin/bash

TEMPLATE_FILE=template.yaml
OUTPUT_TEMPLALE_FILE=serverless-output.yaml
S3=csn-api

# Deploying with AWS Serverless Application Model (SAM)

# Package source code and dep
aws cloudformation package \
	--template-file $TEMPLATE_FILE \
	--output-template-file $OUTPUT_TEMPLALE_FILE \
	--s3-bucket $S3

# Deploy
aws cloudformation deploy \
	--template-file $OUTPUT_TEMPLALE_FILE \
	--stack-name prod \
	--capabilities CAPABILITY_IAM
