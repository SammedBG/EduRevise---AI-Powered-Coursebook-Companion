const mongoose = require('mongoose');
const User = require('../models/User');
const PDF = require('../models/PDF');
require('dotenv').config();

// Sample NCERT Class XI Physics topics for seeding
const samplePDFs = [
  {
    filename: 'ncert-physics-xi-unit1.pdf',
    originalName: 'NCERT Physics XI - Unit 1: Physical World',
    path: 'uploads/sample/ncert-physics-xi-unit1.pdf',
    size: 2048576, // 2MB
    metadata: {
      title: 'Physical World',
      author: 'NCERT',
      subject: 'Physics',
      pages: 25,
      createdAt: new Date('2023-01-15')
    },
    content: {
      extractedText: `Physical World - NCERT Class XI Physics

      Chapter 1: Physical World
      
      The word Science originates from the Latin verb Scientia meaning 'to know'. 
      The Sanskrit word Vijnan and the Arabic word Ilm convey similar meaning, 
      namely 'knowledge'. Science, in a broad sense, is as old as human species. 
      The early civilisations of Egypt, India, China, Greece, Mesopotamia and 
      many others made vital contributions to its progress.
      
      From the sixteenth century onwards, great strides were made in science in 
      Europe. By the middle of the twentieth century, science had become a truly 
      international enterprise, with many cultures and countries contributing to 
      its rapid growth.
      
      What is Science and what is the so-called Scientific Method?
      Science is a systematic attempt to understand natural phenomena in as much 
      detail and depth as possible, and use the knowledge so gained to predict, 
      modify and control phenomena. Science is exploring, experimenting and 
      predicting from what we see around us.
      
      The scientific method involves several interconnected steps : 
      Systematic observations, controlled experiments, qualitative and 
      quantitative reasoning, mathematical modelling, prediction and verification 
      or falsification of theories. Speculation and conjecture also have a place 
      in science; but ultimately, a scientific theory, to be acceptable, must be 
      verified by relevant observations or experiments.
      
      There is no 'final' theory in science and no unquestioned authority among 
      scientists. As observations improve in detail and precision or experiments 
      yield new results, theories must account for them, if necessary, by 
      introducing modifications. Sometimes the modifications may not be drastic 
      and may lie within the framework of existing theory. For example, when 
      Johannes Kepler (1571-1630) examined the extensive data on planetary 
      motion collected by Tycho Brahe (1546-1601), the circular orbits and 
      planetary motions originally envisioned by Nicolas Copernicus (1473-1543) 
      had to be replaced by elliptical orbits to fit the data better. Occasionally, 
      however, the existing theory is simply unable to explain new observations. 
      This causes a major upheaval in science. In the beginning of the twentieth 
      century, it was realised that Newtonian mechanics, till then a very 
      successful theory, could not explain some of the most basic features of 
      atomic phenomena. Similarly, the then accepted wave picture of light 
      became inadequate when it was applied to the interaction of light with 
      matter. It took about three decades to resolve these problems through the 
      formulation of quantum mechanics and the quantum theory of radiation.`,
      processed: true
    },
    tags: ['ncert', 'physics', 'class11', 'physical-world'],
    isPublic: true
  },
  {
    filename: 'ncert-physics-xi-unit2.pdf',
    originalName: 'NCERT Physics XI - Unit 2: Units and Measurements',
    path: 'uploads/sample/ncert-physics-xi-unit2.pdf',
    size: 3072000, // 3MB
    metadata: {
      title: 'Units and Measurements',
      author: 'NCERT',
      subject: 'Physics',
      pages: 35,
      createdAt: new Date('2023-01-15')
    },
    content: {
      extractedText: `Units and Measurements - NCERT Class XI Physics

      Chapter 2: Units and Measurements
      
      Any meaningful term which can be measured is a physical quantity. To 
      measure a physical quantity, we have to find out how many times a 
      standard amount of that physical quantity is present in the quantity being 
      measured. The number thus obtained is known as the magnitude and the 
      standard chosen is called the unit of the physical quantity.
      
      Fundamental and Derived Units:
      The units of fundamental quantities are called fundamental units. The 
      fundamental units are defined arbitrarily. In SI system, the fundamental 
      quantities are length, mass, time, electric current, thermodynamic 
      temperature, amount of substance and luminous intensity. Their units are 
      metre (m), kilogram (kg), second (s), ampere (A), kelvin (K), mole (mol) 
      and candela (cd) respectively.
      
      The units of all other physical quantities can be expressed as combinations 
      of the fundamental units. Such units are called derived units. For example, 
      the unit of speed is metre per second (m/s), the unit of acceleration is 
      metre per second squared (m/s²), the unit of force is newton (N) where 
      1 N = 1 kg m/s².
      
      The International System of Units (SI):
      The International System of Units (abbreviated as SI from the French 
      Système International d'Unités) is the modern form of the metric system 
      and is the most widely used system of measurement. It comprises a coherent 
      system of units of measurement built on seven base units.
      
      Significant Figures:
      The significant figures in a measurement are the digits that are known 
      reliably plus the first uncertain digit. The number of significant figures 
      in a measurement indicates the precision of the measurement. More the 
      number of significant figures, more precise is the measurement.
      
      Rules for determining significant figures:
      1. All non-zero digits are significant.
      2. Zeros between non-zero digits are significant.
      3. Leading zeros are not significant.
      4. Trailing zeros in a number containing a decimal point are significant.
      5. Trailing zeros in a number not containing a decimal point may or may 
         not be significant.
      
      Accuracy and Precision:
      Accuracy refers to the closeness of a measured value to the true value 
      of the quantity. Precision refers to the closeness of two or more 
      measurements to each other. A measurement can be accurate but not 
      precise, precise but not accurate, both accurate and precise, or neither 
      accurate nor precise.`,
      processed: true
    },
    tags: ['ncert', 'physics', 'class11', 'units-measurements'],
    isPublic: true
  },
  {
    filename: 'ncert-physics-xi-unit3.pdf',
    originalName: 'NCERT Physics XI - Unit 3: Motion in a Straight Line',
    path: 'uploads/sample/ncert-physics-xi-unit3.pdf',
    size: 4096000, // 4MB
    metadata: {
      title: 'Motion in a Straight Line',
      author: 'NCERT',
      subject: 'Physics',
      pages: 45,
      createdAt: new Date('2023-01-15')
    },
    content: {
      extractedText: `Motion in a Straight Line - NCERT Class XI Physics

      Chapter 3: Motion in a Straight Line
      
      Motion is one of the most common phenomena we observe around us. 
      The branch of physics that deals with the study of motion of objects 
      is called mechanics. Mechanics is divided into two parts: kinematics 
      and dynamics. Kinematics deals with the description of motion without 
      considering the cause of motion, while dynamics deals with the cause 
      of motion.
      
      Position, Path Length and Displacement:
      To describe the motion of an object, we need to specify its position 
      with respect to time. The position of an object is specified with 
      respect to a reference point called the origin. The path length is 
      the actual distance travelled by the object in a given time interval. 
      Displacement is the change in position of the object. It is a vector 
      quantity and is represented by the shortest distance between the 
      initial and final positions.
      
      Average Velocity and Average Speed:
      Average velocity is the displacement divided by the time interval. 
      It is a vector quantity and its direction is the same as that of 
      displacement. Average speed is the total path length divided by the 
      time interval. It is a scalar quantity.
      
      Instantaneous Velocity and Speed:
      The velocity of an object at a particular instant of time is called 
      instantaneous velocity. It is the limiting value of the average 
      velocity as the time interval approaches zero. The magnitude of 
      instantaneous velocity is called instantaneous speed.
      
      Acceleration:
      Acceleration is the rate of change of velocity with time. It is a 
      vector quantity. If the velocity of an object changes with time, 
      the object is said to be accelerated.
      
      Uniformly Accelerated Motion:
      If the acceleration of an object is constant in magnitude and 
      direction, the motion is called uniformly accelerated motion. For 
      uniformly accelerated motion along a straight line, we have three 
      important equations:
      
      1. v = u + at (velocity-time relation)
      2. s = ut + ½at² (position-time relation)  
      3. v² = u² + 2as (velocity-position relation)
      
      where u is initial velocity, v is final velocity, a is acceleration, 
      s is displacement and t is time.
      
      Relative Velocity:
      The velocity of one object relative to another object is called 
      relative velocity. It is the velocity of an object as observed from 
      another object in motion.`,
      processed: true
    },
    tags: ['ncert', 'physics', 'class11', 'motion', 'kinematics'],
    isPublic: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-buddy');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await PDF.deleteMany({});
    console.log('Cleared existing data');

    // Create a sample user
    const sampleUser = new User({
      username: 'student_demo',
      email: 'student@demo.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      profile: {
        name: 'Demo Student',
        grade: '11',
        subjects: ['Physics', 'Chemistry', 'Mathematics']
      },
      preferences: {
        difficulty: 'medium',
        questionTypes: { mcq: true, saq: true, laq: true }
      }
    });

    await sampleUser.save();
    console.log('Created sample user');

    // Create sample PDFs
    const samplePDFDocuments = samplePDFs.map(pdfData => ({
      ...pdfData,
      uploadedBy: sampleUser._id
    }));

    const createdPDFs = await PDF.insertMany(samplePDFDocuments);
    console.log(`Created ${createdPDFs.length} sample PDFs`);

    console.log('Database seeded successfully!');
    console.log('Sample user credentials:');
    console.log('Email: student@demo.com');
    console.log('Password: password');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
