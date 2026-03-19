// Export base class
export { BaseVideoProvider } from './base-video-provider';

// Export all video providers
export { KieVideoProvider } from './kie-provider';
export { ModalVideoProvider } from './modal-provider';
export { NewApiVideoProvider } from './newapi-provider';

// Import to ensure they are registered
import './kie-provider';
import './modal-provider';
import './newapi-provider';