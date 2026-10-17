import { CustomerHeader } from '@/components/customer/Sidebar';
import { ASSET } from '@/lib/data';

const GROUPS = [
  { title: 'Inspection', photos: ['dphoto-1', 'dphoto-2', 'dphoto-3', 'dmg-1', 'dmg-2', 'dmg-3', 'dmg-4'] },
  { title: 'Repair Progress', photos: ['prog-1', 'prog-2', 'prog-3', 'prog-4', 'prog-5'] },
];

export default function CustomerPhotos() {
  return (
    <>
      <CustomerHeader />
      {GROUPS.map((g) => (
        <section key={g.title} className="mt-6">
          <h3 className="text-base font-semibold">
            {g.title} <span className="font-normal text-gray-400">({g.photos.length})</span>
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            {g.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p} src={ASSET(`${p}.png`)} alt="" className="aspect-[1.1] w-full rounded-xl object-cover" />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
