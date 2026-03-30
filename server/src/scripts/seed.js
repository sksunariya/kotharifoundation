require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const SessionSlot = require('../models/SessionSlot');
const SiteConfig = require('../models/SiteConfig');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminEmail = 'admin@kotharifoundation.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: 'changeme123',
      role: 'admin',
      isVerified: true,
      isActive: true,
      isDeleted: false,
    });
    console.log('✅ Admin user created:', adminEmail, '/ changeme123');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // ── Demo student ───────────────────────────────────────────────────────────
  const studentEmail = 'student@example.com';
  let student = await User.findOne({ email: studentEmail });
  if (!student) {
    student = await User.create({
      name: 'Priya Sharma',
      email: studentEmail,
      password: 'student123',
      role: 'student',
      phone: '9876543210',
      isVerified: true,
      isActive: true,
      isDeleted: false,
    });
    console.log('✅ Demo student created:', studentEmail, '/ student123');
  } else {
    console.log('ℹ️  Demo student already exists');
  }

  // ── Site config ────────────────────────────────────────────────────────────
  let config = await SiteConfig.findOne();
  if (!config) {
    config = await SiteConfig.create({
      platformName: 'Kothari Foundation',
      tagline: 'Empowering students through expert mentorship',
      upiId: 'kotharifoundation@upi',
      upiDisplayName: 'Kothari Foundation',
      supportEmail: 'support@kotharifoundation.com',
      supportPhone: '+91 98765 43210',
      verificationTimeNote: 'Payments are verified within 2-4 hours on business days',
      heroTitle: 'Book a Session With Expert Mentors',
      heroSubtitle: 'Choose from a wide range of mentorship categories and book your slot today',
      footerText: '© 2024 Kothari Foundation. All rights reserved.',
      maintenanceMode: false,
      allowNewRegistrations: true,
      testimonials: [
        {
          name: 'Priya Sharma',
          role: 'Engineering Student, IIT Delhi',
          content: 'The mentorship sessions helped me crack my campus placements with confidence!',
          rating: 5,
        },
        {
          name: 'Rahul Verma',
          role: 'MBA Aspirant',
          content: 'Excellent guidance for CAT preparation. My percentile jumped from 85 to 99!',
          rating: 5,
        },
        {
          name: 'Ananya Singh',
          role: 'Class 12 Student',
          content: 'Board exam tips from the mentors were incredibly helpful. Scored 95%!',
          rating: 5,
        },
        {
          name: 'Karan Mehta',
          role: 'NEET Aspirant',
          content: 'Personalized study plan and weekly doubt sessions made all the difference.',
          rating: 4,
        },
      ],
    });
    console.log('✅ Site config created');
  } else {
    console.log('ℹ️  Site config already exists');
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  const categoryData = [
    {
      name: 'JEE Preparation',
      slug: 'jee-preparation',
      description: 'Expert guidance for JEE Main & Advanced with topic-wise strategy',
      icon: '🔬',
      sortOrder: 1,
      isActive: true,
      isDeleted: false,
    },
    {
      name: 'NEET Preparation',
      slug: 'neet-preparation',
      description: 'Comprehensive NEET preparation with Biology, Physics & Chemistry',
      icon: '⚕️',
      sortOrder: 2,
      isActive: true,
      isDeleted: false,
    },
    {
      name: 'Board Exams',
      slug: 'board-exams',
      description: 'Class 10 & 12 board exam preparation for all major boards',
      icon: '📚',
      sortOrder: 3,
      isActive: true,
      isDeleted: false,
    },
    {
      name: 'Career Counseling',
      slug: 'career-counseling',
      description: 'Personalized career guidance to help you choose the right path',
      icon: '🎯',
      sortOrder: 4,
      isActive: true,
      isDeleted: false,
    },
    {
      name: 'MBA Preparation',
      slug: 'mba-preparation',
      description: 'CAT / XAT / GMAT preparation with expert mentorship',
      icon: '💼',
      sortOrder: 5,
      isActive: true,
      isDeleted: false,
    },
    {
      name: 'Campus Placements',
      slug: 'campus-placements',
      description: 'Interview prep, resume building & soft skills for placements',
      icon: '🏢',
      sortOrder: 6,
      isActive: true,
      isDeleted: false,
    },
  ];

  const categoryMap = {};
  for (const cat of categoryData) {
    let record = await Category.findOne({ slug: cat.slug });
    if (!record) {
      record = await Category.create(cat);
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      console.log(`ℹ️  Category already exists: ${cat.name}`);
    }
    categoryMap[cat.slug] = record;
  }

  // ── Session slots ──────────────────────────────────────────────────────────
  const now = new Date();

  const slotData = [
    {
      title: 'JEE Mains Strategy Session',
      categorySlug: 'jee-preparation',
      description: 'A 1-hour focused session covering high-weightage topics, revision strategy, and time management for JEE Mains.',
      daysFromNow: 1,
      hour: 10,
      price: 299,
      capacity: 1,
    },
    {
      title: 'JEE Advanced Problem Solving',
      categorySlug: 'jee-preparation',
      description: 'Deep-dive into JEE Advanced level problems in Physics and Maths with an expert IIT alumni mentor.',
      daysFromNow: 3,
      hour: 16,
      price: 499,
      capacity: 1,
    },
    {
      title: 'NEET Biology Master Class',
      categorySlug: 'neet-preparation',
      description: 'High-yield Biology topics for NEET — Human Physiology, Genetics, and Ecology covered in depth.',
      daysFromNow: 2,
      hour: 11,
      price: 299,
      capacity: 3,
    },
    {
      title: 'NEET Full Syllabus Revision',
      categorySlug: 'neet-preparation',
      description: 'Rapid-fire revision of the entire NEET syllabus — best taken 2 weeks before the exam.',
      daysFromNow: 5,
      hour: 9,
      price: 399,
      capacity: 5,
    },
    {
      title: 'Class 12 Maths Doubt Session',
      categorySlug: 'board-exams',
      description: 'Bring your toughest Maths problems — our mentor will solve and explain each one live.',
      daysFromNow: 1,
      hour: 18,
      price: 199,
      capacity: 1,
    },
    {
      title: 'Class 10 Science Crash Course',
      categorySlug: 'board-exams',
      description: 'Quick and effective revision of Class 10 Science for CBSE / ICSE board exams.',
      daysFromNow: 4,
      hour: 15,
      price: 199,
      capacity: 5,
    },
    {
      title: '1-on-1 Career Guidance Session',
      categorySlug: 'career-counseling',
      description: 'A personalized session to map your strengths, explore career options, and build a roadmap.',
      daysFromNow: 2,
      hour: 14,
      price: 599,
      capacity: 1,
    },
    {
      title: 'CAT Quant Strategy Workshop',
      categorySlug: 'mba-preparation',
      description: 'Cracking CAT Quant — shortcuts, tricks, and practice problems with a 99 percentiler.',
      daysFromNow: 3,
      hour: 19,
      price: 399,
      capacity: 10,
    },
    {
      title: 'Mock Interview + Feedback',
      categorySlug: 'campus-placements',
      description: 'A full mock technical/HR interview followed by detailed feedback to sharpen your performance.',
      daysFromNow: 2,
      hour: 17,
      price: 499,
      capacity: 1,
    },
    {
      title: 'Resume Review Session',
      categorySlug: 'campus-placements',
      description: 'Get your resume reviewed and rewritten by a senior professional with 10+ years of experience.',
      daysFromNow: 1,
      hour: 12,
      price: 299,
      capacity: 1,
    },
  ];

  for (const s of slotData) {
    const exists = await SessionSlot.findOne({ title: s.title });
    if (exists) {
      console.log(`ℹ️  Slot already exists: ${s.title}`);
      continue;
    }

    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + s.daysFromNow);
    startTime.setHours(s.hour, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

    await SessionSlot.create({
      categoryId: categoryMap[s.categorySlug]._id,
      title: s.title,
      description: s.description,
      startTime,
      endTime,
      price: s.price,
      capacity: s.capacity,
      bookedCount: 0,
      isActive: true,
      isDeleted: false,
    });
    console.log(`✅ Slot created: ${s.title}`);
  }

  console.log('\n🎉 Seeding complete!');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Admin    → admin@kotharifoundation.com / changeme123');
  console.log('Student  → student@example.com / student123');
  console.log('─────────────────────────────────────────────────────────');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
