# Shop Management System - Setup Guide

## Backend Setup

1. Navigate to the backend folder:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create `.env` file:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Update `.env` with your MongoDB URI and other configuration:
\`\`\`
MONGODB_URI=mongodb://localhost:27017/shop-management
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
\`\`\`

5. Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

The backend API will be available at `http://localhost:5000`

## Frontend Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create `.env.local`:
\`\`\`bash
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at `http://localhost:3000`

## Features

### Authentication
- User registration and login
- Role-based access control (Admin, Manager, Staff)
- JWT-based session management

### Product Management
- Create, read, update products
- Track SKU and pricing
- Categorize products

### Inventory Tracking
- Real-time inventory levels
- Low stock alerts
- Reorder point management
- Warehouse tracking

### Sales Management
- Record sales transactions
- Multiple payment methods
- Sales history and tracking
- Inventory auto-update on sale

### Reports & Analytics
- Sales trends and charts
- Category-wise breakdown
- Date range filtering
- CSV export functionality

### Admin Dashboard
- User management
- Role assignment
- User activation/deactivation
- User statistics

### Offline Support
- Service worker caching
- IndexedDB for offline data
- Automatic sync when online
- Offline mode indicators

## Testing

### Test Credentials

Default admin user (create via registration):
- Email: admin@example.com
- Password: password123
- Role: Admin

Manager user:
- Email: manager@example.com
- Password: password123
- Role: Manager

Staff user:
- Email: staff@example.com
- Password: password123
- Role: Staff

## Deployment

### Backend (Node.js/Express)
- Deploy to services like Heroku, Railway, or Render
- Set environment variables (MongoDB URI, JWT secret, etc.)
- Example with Railway: Push to GitHub and connect repository

### Frontend (Next.js)
- Deploy to Vercel (recommended for Next.js)
- Set `NEXT_PUBLIC_API_URL` to your backend API URL
- Or deploy to other services supporting Node.js

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product

### Inventory
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/product/:productId` - Get by product
- `POST /api/inventory` - Create inventory
- `PUT /api/inventory/:id` - Update inventory

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/range` - Get sales by date range
- `POST /api/sales` - Create sale

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or remote connection is accessible
- Check `MONGODB_URI` in `.env` file
- Verify network access if using MongoDB Atlas

### API Connection Issues
- Verify backend is running on correct port
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure CORS is properly configured in backend

### Authentication Issues
- Clear browser localStorage: `localStorage.clear()`
- Logout and login again
- Check token expiration time

### Offline Mode
- Offline indicator shows when no internet
- Service worker caches API responses
- Changes sync automatically when online
- Check browser DevTools → Application → Service Workers
