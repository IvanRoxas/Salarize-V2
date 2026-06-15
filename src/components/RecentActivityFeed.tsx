import { PlusCircle, Pencil } from 'lucide-react';

function getRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentActivityFeed({ activities }: { activities: any[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">No recent activity.</p>;
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => {
        // We'll guess the action based on if created_at is very close to updated_at
        const isNew = new Date(activity.updated_at).getTime() - new Date(activity.created_at).getTime() < 10000;
        
        return (
          <div key={activity.id} className="relative flex items-start space-x-3">
            {/* Timeline line connecting items */}
            {index !== activities.length - 1 && (
              <span 
                className="absolute left-4 top-8 -bottom-6 w-px bg-slate-200" 
                aria-hidden="true" 
              />
            )}
            
            <div className="relative">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${isNew ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                {isNew ? <PlusCircle className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </span>
            </div>
            
            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
              <div>
                <p className="text-sm text-slate-800">
                  {isNew ? (
                    <>New Hire: <span className="font-semibold">{activity.first_name} {activity.last_name}</span> joined as <span className="font-medium text-slate-600">{activity.position}</span></>
                  ) : (
                    <>Profile Updated: <span className="font-semibold">{activity.first_name} {activity.last_name}</span>'s record was modified</>
                  )}
                </p>
              </div>
              <div className="text-right text-xs whitespace-nowrap text-slate-400 font-medium">
                {getRelativeTime(new Date(activity.updated_at))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
