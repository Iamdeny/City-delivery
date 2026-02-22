import { OpsSessionProvider } from './OpsSessionProvider';
import { OpsHeader } from './_ui/OpsHeader';
import { OpsSidebar } from './_ui/OpsSidebar';
import { OpsToasterClient } from './_ui/OpsToasterClient';
import { OpsHotkeysClient } from './_ui/OpsHotkeysClient';

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OpsSessionProvider>
      <div className="min-h-screen bg-[#F6F7F8]">
        <div className="flex min-h-screen">
          <OpsSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <OpsHeader />
            <div className="px-3 sm:px-4 py-4">{children}</div>
          </div>
        </div>
      </div>
      <OpsToasterClient />
      <OpsHotkeysClient />
    </OpsSessionProvider>
  );
}

