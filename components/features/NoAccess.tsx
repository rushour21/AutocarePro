import { SearchX } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';

/** Shown when a record does not exist or the signed-in user is not allowed to see it (we never distinguish). */
export function NoAccess({ what, backHref }: { what: string; backHref: string }) {
  return (
    <div className="neu mx-auto mt-10 max-w-lg">
      <EmptyState
        icon={<SearchX className="h-7 w-7" />}
        title={`This ${what} isn’t available`}
        text={`It may not exist, or it isn’t assigned to your account.`}
        action={<Button href={backHref}>Go back</Button>}
      />
    </div>
  );
}
