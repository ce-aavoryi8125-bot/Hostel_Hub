const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Hostel = require('../models/Hostel');
const Transaction = require('../models/Transaction');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');
    await seedDefaults();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

async function seedDefaults() {
  try {
    // Default admin
    const adminExists = await Admin.findOne({ email: 'admin@hostelhub.dev' });
    if (!adminExists) {
      await Admin.create({
        name:     'Hostel Hub Admin',
        email:    'admin@hostelhub.dev',
        password: await bcrypt.hash('admin123', 10),
        role:     'admin'
      });
      console.log('✅ Default admin seeded');
    }

    // Default manager
    const managerExists = await Manager.findOne({ email: 'manager@hostelhub.dev' });
    if (!managerExists) {
      await Manager.create({
        name:     'John Owusu',
        email:    'manager@hostelhub.dev',
        phone:    '+233 24 111 2222',
        password: await bcrypt.hash('manager123', 10),
        role:     'manager',
        bankDetails: {
          bankName:      'Ghana Commercial Bank',
          accountName:   'John Owusu Hostel Ventures',
          accountNumber: '1029384756'
        }
      });
      console.log('✅ Default manager seeded');
    }

    // Default hostels
    const hostelCount = await Hostel.countDocuments();
    if (hostelCount === 0) {
      const manager = await Manager.findOne({ email: 'manager@hostelhub.dev' });
      const mId    = manager ? manager._id.toString() : 'manager-1';

      await Hostel.insertMany([
        {
          name:         'Tarkwa Hostel Haven',
          location:     'Agric Hill',
          address:      'Near UMaT Gate',
          pricePerYear: 4500,
          rating:       4.8,
          mapsUrl:      'https://maps.google.com/?q=Tarkwa+UMaT+Hostel',
          facilities:   ['Wi-Fi', 'Power backup', 'Water', 'Security'],
          agentName:    'Ama Mensah',
          agentPhone:   '+233 20 123 4567',
          agentEmail:   'ama@hostelhub.dev',
          managerId:    mId,
          managerName:  'John Owusu',
          managerPhone: '+233 24 111 2222',
          managerEmail: 'manager@hostelhub.dev',
          description:  'Popular hostel near the university for students who want safe, clean accommodation with agent support.',
          photos: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
          ],
          roomTypes: {
            '1-in-a-room': { price: 9000, gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] },
            '2-in-a-room': { price: 7000, gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] },
            '3-in-a-room': { price: 5500, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] },
            '4-in-a-room': { price: 4500, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] }
          },
          kitchenPhotos: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'],
          visits: 0
        },
        {
          name:         'University Vista Lodge',
          location:     'Akyempim',
          address:      'Opposite UMaT East Gate',
          pricePerYear: 5000,
          rating:       4.6,
          mapsUrl:      'https://maps.google.com/?q=University+Vista+Lodge+Tarkwa',
          facilities:   ['Laundry', 'Study hall', 'Water', 'Wi-Fi'],
          agentName:    'Kwame Boateng',
          agentPhone:   '+233 24 987 6543',
          agentEmail:   'kwame@hostelhub.dev',
          managerId:    mId,
          managerName:  'John Owusu',
          managerPhone: '+233 24 111 2222',
          managerEmail: 'manager@hostelhub.dev',
          description:  'A student-friendly lodge with roomy shared spaces and easy access to campus transport.',
          photos: [
            'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'
          ],
          roomTypes: {
            '2-in-a-room': { price: 8000, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] },
            '4-in-a-room': { price: 5000, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] }
          },
          kitchenPhotos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'],
          visits: 0
        }
      ]);

      // Seed sample transactions
      await Transaction.insertMany([
        {
          managerId:    mId,
          hostelId:     'hostel-seed-1',
          hostelName:   'Tarkwa Hostel Haven',
          type:         'income',
          amount:       4500,
          category:     'Rent Payment',
          description:  '4-in-a-room rent paid by Albert Appiah',
          studentName:  'Albert Appiah',
          studentEmail: 'albert@umat.edu.gh'
        },
        {
          managerId:   mId,
          hostelId:    'hostel-seed-1',
          hostelName:  'Tarkwa Hostel Haven',
          type:        'expense',
          amount:      120,
          category:    'Electricity',
          description: 'ECG prepaid credit purchase'
        },
        {
          managerId:   mId,
          hostelId:    'hostel-seed-1',
          hostelName:  'Tarkwa Hostel Haven',
          type:        'expense',
          amount:      80,
          category:    'Maintenance',
          description: 'Plumber fee to fix kitchen sink'
        }
      ]);

      console.log('✅ Default hostels and transactions seeded');
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

module.exports = connectDB;
