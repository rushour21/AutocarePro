import { Plus } from 'lucide-react';
import { AdminJobBar, AdminJobTabs } from '@/components/admin/JobTabs';
import { ASSET, progressPhotos } from '@/lib/data';

const inspection = [ASSET('dphoto-1.png'), ASSET('dphoto-2.png'), ASSET('dphoto-3.png'), ASSET('dmg-1.png')];

export default function AdminPhotos() {
  return (
    <>
      <AdminJobBar />
      <AdminJobTabs />
      {[
        ['Inspection', inspection],
        ['Repair Progress', progressPhotos],
      ].map(([title, list]) => (
        <section key={title as string} className="mt-6">
          <h3 className="text-[15px] font-semibold">
            {title as string} <span className="font-normal text-gray-400">({(list as string[]).length})</span>
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
            {(list as string[]).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p} src={p} alt="" className="aspect-[4/3] w-full rounded-lg object-cover shadow-card" />
            ))}
            <button className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#b9cdf5] text-sm text-[#2f6fed]">
              <Plus className="h-4 w-4" /> Add Photo
            </button>
          </div>
        </section>
      ))}
    </>
  );
}
