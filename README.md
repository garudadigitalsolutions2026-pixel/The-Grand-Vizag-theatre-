# The Grand Vizag - Private Screening Estate

A premium movie theater experience with real-time seat booking and Baroque aesthetics.

## Deployment Guide

### Vercel Deployment
To deploy this application to Vercel, follow these steps:

1. **Push to GitHub**: Extract the files and push them to a new GitHub repository.
2. **Import to Vercel**: Connect your GitHub account and import the repository.
3. **Configure Environment Variables**:
   In Vercel Project Settings, add the following environment variables:
   - `JWT_SECRET`: A secret string for authentication.
   - `AWS_REGION`: Your DynamoDB region (e.g., `ap-south-1`).
   - `AWS_ACCESS_KEY_ID`: Your AWS Access Key.
   - `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Key.
   - `RAZORPAY_KEY_ID`: Your Razorpay Test Key ID.
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Test Key Secret.
   - `BREVO_API_KEY`: Your Brevo API Key (for email).
4. **Vercel Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### GitHub Flow
The included `.github/workflows/main.yml` will automatically check your build and linting on every push to the `main` branch.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, Motion.
- **Backend**: Node.js, Express, Razorpay SDK, Brevo API.
- **Database**: AWS DynamoDB (for distributed persistence).
- **Authentication**: JWT with Cookie-based persistence.

## Features
- **Cinematic UI**: 2.5D scroll parallax and marble-textured elements.
- **Real-time Selection**: Visual seat grid with horizontal scroll on mobile.
- **Admin Control**: Master block functionality for offline sales.
- **Secure Payments**: Razorpay integration for effortless booking.
