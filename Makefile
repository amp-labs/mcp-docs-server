# Switch gcloud context to dev project.
.PHONY: gcloud/dev
gcloud/dev:
	gcloud config set project ampersand-dev

# Switch gcloud context to staging project.
.PHONY: gcloud/staging
gcloud/staging:
	gcloud config set project ampersand-stag

# Switch gcloud context to prod project.
.PHONY: gcloud/prod
gcloud/prod:
	gcloud config set project ampersand-prod


# Deploy the archive-db cloud function to dev.
.PHONY: deploy/dev
deploy/dev: gcloud/dev
	pnpm build
	pnpm gcloud:deploy


# Deploy the archive-db cloud function to dev.
.PHONY: deploy/staging
deploy/staging: gcloud/staging
	pnpm build
	pnpm deploy


# Deploy the archive-db cloud function to prod.
.PHONY: deploy/prod
deploy/prod: gcloud/prod
	pnpm build
	pnpm deploy


