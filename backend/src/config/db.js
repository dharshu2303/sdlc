const mongoose = require('mongoose');
const dns = require('dns');
const store = require('../dataStore');
const User = require('../models/User');
const Methodology = require('../models/Methodology');
const Project = require('../models/Project');
const Phase = require('../models/Phase');
const Artifact = require('../models/Artifact');
const { Version, Approval, AuditLog } = require('../models/Governance');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    console.log('ℹ️  MongoDB Setup Ready: Waiting for MongoDB Cluster URI in .env (MONGODB_URI="mongodb+srv://...")');
    return;
  }

  if (uri.includes('<db_password>')) {
    console.log('ℹ️  MongoDB Cluster URI configured (Cluster0). Awaiting password replacement for <db_password> in backend/.env.');
    return;
  }

  try {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {}

    console.log('🔄 Connecting to MongoDB Cluster...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} / ${conn.connection.name}`);

    // Hydrate & Seed initial system data if needed
    await seedAndSyncDB();

    // Listen to connection events
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully.');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    console.log('⚠️  Falling back to high-performance in-memory cache until MongoDB connection is restored.');
  }
};

const seedAndSyncDB = async () => {
  try {
    // 1. Seed admin user ONLY if collection is completely empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Creating default Admin account in MongoDB...');
      await User.create({
        id: 'usr-admin-01',
        name: 'System Administrator',
        email: 'admin@gmail.com',
        password: 'admin',
        role: 'Admin',
        title: 'SDLC System Administrator',
        systemRole: 'ADMIN'
      });
    }

    // Always hydrate store.users directly from MongoDB
    store.users = await User.find({}).lean();

    // 2. Ensure methodologies exist in DB
    const methCount = await Methodology.countDocuments();
    if (methCount === 0 && store.methodologies.length > 0) {
      for (const m of store.methodologies) {
        await Methodology.create(m);
      }
    }
    store.methodologies = await Methodology.find({}).lean();

    // 3. Hydrate Projects, Phases, Artifacts from DB
    const [dbProjects, dbPhases, dbArtifacts, dbAudits] = await Promise.all([
      Project.find({}).lean(),
      Phase.find({}).lean(),
      Artifact.find({}).lean(),
      AuditLog.find({}).lean()
    ]);

    store.projects = dbProjects;
    store.phases = dbPhases;
    store.artifacts = dbArtifacts;
    store.auditLogs = dbAudits;

    console.log(`📦 MongoDB Synced: ${store.projects.length} Projects, ${store.phases.length} Phases, ${store.artifacts.length} Artifacts, ${store.users.length} Users.`);
  } catch (err) {
    console.error('Error during MongoDB sync:', err.message);
  }
};

// Helper to save or update any entity to MongoDB in real-time
const syncEntityToMongo = async (collectionName, data) => {
  if (!isConnected) return;
  try {
    switch (collectionName) {
      case 'users':
        await User.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true });
        break;
      case 'projects':
        await Project.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true });
        break;
      case 'phases':
        await Phase.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true });
        break;
      case 'artifacts':
        await Artifact.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true });
        break;
      case 'methodologies':
        await Methodology.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true });
        break;
      case 'auditLogs':
        await AuditLog.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true });
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Failed to sync ${collectionName} to MongoDB:`, err.message);
  }
};

module.exports = {
  connectDB,
  seedAndSyncDB,
  syncEntityToMongo,
  getIsConnected: () => isConnected
};
