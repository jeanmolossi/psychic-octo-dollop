This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, copy .env.example

```bash
cp .env.example .env
```

**Then, make sure you have filled `.env` properly with needed vars.**

And then run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## This application uses a bunch of tools

- [Supabase](https://supabase.com/)
- [Stripe](https://stripe.com/br)

## The proposal

### Landing page

A landing page presenting the platform

![image](./docs/landing-page.jpeg)
![image](./docs/landing-page-2.jpeg)
![image](./docs/landing-page-3.jpeg)
![image](./docs/landing-page-4.jpeg)

### Sign up

A sign up page, to create an account on the platform

![image](./docs/sign-up.jpeg)

### Login

A login page, to access the platform

![image](./docs/login.jpeg)

### Dashboard

A dashboard, to manage the workspaces

![image](./docs/dashboard.jpeg)

### Workspace

Inside workspace you have three levels of editor

1. Workspace editor
2. Folder editor
3. File editor

![image](./docs/editor.jpeg)

### Trash management

You can move files or folders to trash.

You can undo it or delete completly

![image](./docs/trash-modal.jpeg)
![image](./docs/in-trash-file.jpeg)

### Share your workspaces

![image](./docs/share-workspaces.jpeg)

Search your friends and share your workspace with them

![image](./docs/collaborator-search.jpeg)

Do it with realtime collaboratino

![image](./docs/realtime-collaboration.jpeg)

### Start your subscription securely with Stripe

You can upgrade your workspaces with a level up subscription

![image](./docs/subscription-modal.jpeg)

The payment is processed by stripe!

![image](./docs/pay-subscription.jpeg)

### Alterante between white and dark colors

![image](./docs/toggle-colors.jpeg)
