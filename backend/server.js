require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// App Configuration
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anna-setu';
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Successfully connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// --- Import Routes ---
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donor');
const adminRoutes = require('./routes/admin');
const volunteerRoutes = require('./routes/volunteer');
const receiverRoutes = require('./routes/receiver');
const compostRoutes = require('./routes/compost'); 
const userRoutes = require('./routes/user');// Add this line

// --- API Routes ---
app.get('/', (req, res) => res.json({ message: 'Welcome to the Anna Setu API!' }));
app.use('/api/auth', authRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/receiver', receiverRoutes);
app.use('/api/compost', compostRoutes);
app.use('/api/users', userRoutes);// Add this line

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});