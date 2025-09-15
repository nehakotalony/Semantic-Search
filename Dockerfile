name: Deploy to Cloud Run
 
on:

  push:

    branches: [main]
 
jobs:

  deploy:

    runs-on: ubuntu-latest

    permissions:

      contents: read

      packages: write
 
    steps:

      - name: Checkout code

        uses: actions/checkout@v4
 
      - name: Set up Cloud SDK

        uses: google-github-actions/setup-gcloud@v2

        with:

          project_id: ${{ secrets.GCLOUD_PROJECT }}

          service_account_key: ${{ secrets.GCLOUD_SERVICE_ACCOUNT }}

          export_default_credentials: true
 
      - name: Debug: Verify Project ID

        run: |

          if [ -z "${{ secrets.GCLOUD_PROJECT }}" ]; then

            echo "❌ ERROR: GCLOUD_PROJECT secret is empty!"

            echo "Go to GitHub Settings > Secrets > Actions and set GCLOUD_PROJECT to your GCP Project ID (e.g., semantic-search-app-123456)"

            exit 1

          fi

          echo "✅ Using Project ID: ${{ secrets.GCLOUD_PROJECT }}"
 
      - name: Build Docker image

        run: |

          docker build -t gcr.io/${{ secrets.GCLOUD_PROJECT }}/semantic-search .
 
      - name: Push to Google Container Registry

        run: |

          docker push gcr.io/${{ secrets.GCLOUD_PROJECT }}/semantic-search
 
      - name: Deploy to Cloud Run

        run: |

          gcloud run deploy semantic-search \

            --image gcr.io/${{ secrets.GCLOUD_PROJECT }}/semantic-search \

            --platform managed \

            --region us-central1 \

            --allow-unauthenticated \

            --quiet
 
# Use official Python 3.10 slim image from Google's container registry

FROM gcr.io/deeplearning-platform-release/base-cpu:latest
 
# Set working directory

WORKDIR /app
 
# Copy requirements first (for caching)

COPY requirements.txt .
 
# Install dependencies

RUN pip install --no-cache-dir -r requirements.txt
 
# Copy everything else

COPY . .
 
# Expose port 8080 (required by Cloud Run)

EXPOSE 8080
 
# Run the app with Gunicorn

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "--timeout", "0", "app:app"]
 