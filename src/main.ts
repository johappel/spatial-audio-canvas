import './styles/tokens.css';
import './styles/base.css';
import { AppController, setAppController } from './app/AppController';
import './ui/App';

async function bootstrap(): Promise<void> {
  const controller = new AppController();
  setAppController(controller);
  await controller.init('demo-table');
}

void bootstrap().catch((error) => console.error('[main] Start fehlgeschlagen', error));