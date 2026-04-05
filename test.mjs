import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://tsai7683_db_user:7lXkLFWxAJpShMHn@cluster0.bcdblk4.mongodb.net/skillswap?appName=Cluster0';

async function test() {
  try {
    console.log('Connecting...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

test();
