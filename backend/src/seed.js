const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const { User, Society, Vehicle, Order, Payment, QRCode } = require('./models');
const { ROLES } = require('./config/constants');
const logger = require('./utils/logger');
const { generateRandomToken, encryptPayload } = require('./utils/cryptoUtils');
const { generateQRDataUrl } = require('./utils/qrGenerator');

const seedData = async () => {
  try {
    await connectDB();
    logger.info('Seeding database with default Super Admin, test society, and test accounts...');

    // 1. Create Super Admin
    const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
    const [superAdmin] = await User.findOrCreate({
      where: { email: 'superadmin@qrparky.com' },
      defaults: {
        name: 'Super Administrator',
        email: 'superadmin@qrparky.com',
        phone: '9999999999',
        passwordHash: superAdminPassword,
        role: ROLES.SUPER_ADMIN,
        status: 'approved',
      },
    });

    // 2. Create Test Approved Society
    const inviteLinkToken = generateRandomToken(24);
    const [society] = await Society.findOrCreate({
      where: { name: 'Greenwood Palms Society' },
      defaults: {
        name: 'Greenwood Palms Society',
        address: '102 Palm Beach Road, Bandra West, Mumbai 400050',
        submittedBy: { name: 'Rajesh Sharma', phone: '9820012345', email: 'societyadmin@greenwood.com' },
        status: 'approved',
        approvedBy: superAdmin.id,
        approvedAt: new Date(),
        inviteLinkToken,
        inviteLinkExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // 3. Create Society Admin
    const socAdminPassword = await bcrypt.hash('SocietyAdmin@123', 10);
    const [socAdmin] = await User.findOrCreate({
      where: { email: 'societyadmin@greenwood.com' },
      defaults: {
        name: 'Rajesh Sharma (Admin)',
        email: 'societyadmin@greenwood.com',
        phone: '9820012345',
        passwordHash: socAdminPassword,
        role: ROLES.SOCIETY_ADMIN,
        societyId: society.id,
        status: 'approved',
      },
    });

    await society.update({ adminUserId: socAdmin.id });

    // 4. Create Member Account
    const memberPassword = await bcrypt.hash('Member@123', 10);
    const [member] = await User.findOrCreate({
      where: { email: 'member@greenwood.com' },
      defaults: {
        name: 'Aarav Mehta',
        email: 'member@greenwood.com',
        phone: '9876543210',
        passwordHash: memberPassword,
        role: ROLES.MEMBER,
        societyId: society.id,
        status: 'approved',
      },
    });

    // 5. Create Test Vehicles
    const [veh1] = await Vehicle.findOrCreate({
      where: { societyId: society.id, vehicleNumber: 'MH02AB1234' },
      defaults: {
        memberId: member.id,
        societyId: society.id,
        vehicleNumber: 'MH02AB1234',
        vehicleType: '4wheeler',
        status: 'active',
        reviewedBy: socAdmin.id,
        reviewedAt: new Date(),
      },
    });

    // Generate active QR Code for test active vehicle
    const qrPayload = {
      vehicleId: veh1.id,
      societyId: society.id,
      vehicleNumber: veh1.vehicleNumber,
      issuedAt: new Date().toISOString(),
    };
    const encryptedToken = encryptPayload(qrPayload);
    const qrImageUrl = await generateQRDataUrl(encryptedToken);

    await QRCode.findOrCreate({
      where: { vehicleId: veh1.id },
      defaults: {
        vehicleId: veh1.id,
        payloadEncrypted: encryptedToken,
        qrImageUrl,
        isActive: true,
      },
    });

    // Pending vehicle awaiting payment
    await Vehicle.findOrCreate({
      where: { societyId: society.id, vehicleNumber: 'MH02CD5678' },
      defaults: {
        memberId: member.id,
        societyId: society.id,
        vehicleNumber: 'MH02CD5678',
        vehicleType: '2wheeler',
        status: 'awaiting_payment',
        reviewedBy: socAdmin.id,
        reviewedAt: new Date(),
      },
    });

    // Pending vehicle awaiting admin approval
    await Vehicle.findOrCreate({
      where: { societyId: society.id, vehicleNumber: 'MH02EF9012' },
      defaults: {
        memberId: member.id,
        societyId: society.id,
        vehicleNumber: 'MH02EF9012',
        vehicleType: '4wheeler',
        status: 'pending',
      },
    });

    logger.info('=====================================================');
    logger.info('🎉 QrParky Database Seed Completed Successfully!');
    logger.info('-----------------------------------------------------');
    logger.info('🔑 DEMO CREDENTIALS:');
    logger.info('1. Super Admin:');
    logger.info('   Email: superadmin@qrparky.com | Password: SuperAdmin@123');
    logger.info('2. Society Admin:');
    logger.info('   Email: societyadmin@greenwood.com | Password: SocietyAdmin@123');
    logger.info('3. Member User:');
    logger.info('   Email: member@greenwood.com | Password: Member@123');
    logger.info('🔗 Society Member Invite Token:', inviteLinkToken);
    logger.info('=====================================================');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedData();
