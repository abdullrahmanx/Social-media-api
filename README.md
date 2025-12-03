<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

<h1 align="center">Social Media API</h1>

<p align="center">A full-featured social media REST API built with NestJS, Prisma, and PostgreSQL</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
</p>

---

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication (access & refresh tokens)
  - Email verification
  - Password reset functionality
  - Role-based access control (User/Admin)

- **User Management**
  - User registration and login
  - Profile management with avatar and cover images
  - Public/Private account settings
  - User search and discovery

- **Posts**
  - Create, read, update, delete posts
  - Media uploads (images, videos, documents)
  - Visibility settings (Public, Private, Friends)
  - Pagination and filtering

- **Comments**
  - Nested comments (replies)
  - Media attachments
  - Pagination support

- **Social Features**
  - Follow/Unfollow users
  - Follow requests for private accounts
  - Accept/Decline follow requests
  - Followers/Following lists

- **Likes**
  - Like/Unlike posts and comments

- **Real-time Chat**
  - Direct messages
  - Group chats
  - Media sharing in messages
  - Chat management

- **Notifications**
  - Real-time notifications via WebSocket
  - Notification types: Like, Comment, Follow, Mention, Message
  - Mark as read functionality
  - Unread count

- **Security**
  - Rate limiting (Throttler)
  - Helmet security headers
  - Input validation
  - XSS protection

---

## 🛠️ Tech Stack

| Technology | Description |
|------------|-------------|
| [NestJS](https://nestjs.com/) | Progressive Node.js framework |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [Prisma](https://www.prisma.io/) | Next-generation ORM |
| [Passport.js](http://www.passportjs.org/) | Authentication middleware |
| [JWT](https://jwt.io/) | JSON Web Tokens |
| [Cloudinary](https://cloudinary.com/) | Media storage & management |
| [Socket.IO](https://socket.io/) | Real-time communication |
| [Nodemailer](https://nodemailer.com/) | Email sending |

---

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd social-media-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/social_media_db"

# JWT
JWT_ACCESS="your-access-token-secret"
JWT_REFRESH="your-refresh-token-secret"

# Cloudinary
CLOUD_NAME="your-cloud-name"
API_KEY="your-api-key"
API_SECRET="your-api-secret"

# Email (Mailtrap)
MAILTRAP_HOST="smtp.mailtrap.io"
MAILTRAP_USER="your-mailtrap-user"
MAILTRAP_PASS="your-mailtrap-pass"

# App
PORT=3000
FRONTEND_URL="http://localhost:3000"
```

---

## 🚀 Running the Application

```bash
# Development mode
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

---

## 📚 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/logout` | User logout |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/auth/verify-email` | Verify email address |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Reset password |
| `POST` | `/auth/change-password` | Change password |

### 👤 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/me` | Get current user profile |
| `GET` | `/users/:id` | Get user by ID |
| `PUT` | `/users/me` | Update profile |
| `DELETE` | `/users/me` | Delete account |

### 📝 Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/posts` | Create post |
| `GET` | `/posts` | Get all posts (paginated) |
| `GET` | `/posts/:id` | Get single post |
| `PUT` | `/posts/:id` | Update post |
| `DELETE` | `/posts/:id` | Delete post |

### 💬 Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/comments/post/:postId` | Create comment |
| `GET` | `/comments/post/:postId` | Get post comments |
| `GET` | `/comments/replies/:commentId` | Get comment replies |
| `PUT` | `/comments/:id` | Update comment |
| `DELETE` | `/comments/:id` | Delete comment |

### 👥 Follow

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/:userId/follower` | Follow user |
| `PATCH` | `/users/:followerId/accept-follower` | Accept follow request |
| `PATCH` | `/users/:followerId/decline-follower` | Decline follow request |
| `GET` | `/users/followers` | Get followers |
| `GET` | `/users/following` | Get following |

### 💬 Chats

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chats` | Create chat |
| `GET` | `/chats` | Get all chats |
| `GET` | `/chats/:id` | Get single chat |
| `PUT` | `/chats/:id` | Update chat |
| `DELETE` | `/chats/:id` | Delete chat |

### ✉️ Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/messages` | Send message |
| `GET` | `/chats/:chatId/messages` | Get chat messages |
| `GET` | `/messages/:id` | Get single message |
| `PUT` | `/messages/:id` | Update message |
| `DELETE` | `/messages/:id` | Delete message |

### 🔔 Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | Get notifications |
| `GET` | `/notifications/unread` | Get unread count |
| `PUT` | `/notifications/:id/mark-read` | Mark as read |
| `PUT` | `/notifications/mark-allread` | Mark all as read |

### ❤️ Likes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/likes/post/:postId` | Like post |
| `DELETE` | `/likes/post/:postId` | Unlike post |
| `POST` | `/likes/comment/:commentId` | Like comment |
| `DELETE` | `/likes/comment/:commentId` | Unlike comment |

---

## 🔌 WebSocket Events

Connect to `/notifications` namespace for real-time notifications.

| Event | Description |
|-------|-------------|
| `notifications:get` | Get all notifications |
| `notifications:getUnread` | Get unread count |
| `notifications:markAsRead` | Mark notification as read |
| `notifications:markAllAsRead` | Mark all as read |
| `notifications:deleteNotification` | Delete notification |

---

---

## 📁 Project Structure

```
src/
├── admin/          # Admin module
├── auth/           # Authentication module
├── chat/           # Chat module
├── cloudinary/     # File upload service
├── comments/       # Comments module
├── common/         # Shared utilities, guards, decorators
├── follow/         # Follow system module
├── likes/          # Likes module
├── messages/       # Messages module
├── notifications/  # Notifications module (REST + WebSocket)
├── posts/          # Posts module
├── prisma/         # Database service
├── users/          # Users module
├── app.module.ts   # Root module
└── main.ts         # Application entry point
```

---

## 🚢 Deployment

When you're ready to deploy your NestJS application to production, check out the [deployment documentation](https://docs.nestjs.com/deployment).

For cloud-based deployment, you can use [NestJS Mau](https://mau.nestjs.com):

```bash
npm install -g @nestjs/mau
mau deploy
```

---

## 📄 License

This project is [MIT licensed](LICENSE).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request