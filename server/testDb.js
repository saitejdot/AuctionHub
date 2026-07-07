const mongoose = require('mongoose');

const test = async () => {
  try {
    const uri = 'mongodb+srv://bollimunthanagasaiteja_db_user:1SRRw2Xd1bNcGHGE@cluster0.jzvxaim.mongodb.net/?appName=Cluster0';
    console.log('Attempting to connect...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
};

test();
