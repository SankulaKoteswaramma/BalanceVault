import { BootstrapService } from '../services/bootstrap.service';
import { logger } from '../utils/logger';

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || 'superadmin@balancevault.com';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'VaultAdmin@2026!';
  const fullName = process.env.ADMIN_BOOTSTRAP_NAME || 'Primary System Administrator';
  const phoneNumber = process.env.ADMIN_BOOTSTRAP_PHONE || '+15550198273';
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET || '';

  if (!bootstrapSecret) {
    logger.error('Bootstrap aborted: BOOTSTRAP_SECRET environment variable is not defined.');
    process.exit(1);
  }

  logger.info('Initiating first-administrator bootstrap process...');

  try {
    const admin = await BootstrapService.bootstrapFirstAdmin({
      email,
      password,
      fullName,
      phoneNumber,
      bootstrapSecret,
    });

    logger.info('Initial Super Administrator created successfully.', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });
    process.exit(0);
  } catch (error) {
    logger.error('Bootstrap failed', error);
    process.exit(1);
  }
}

main();
