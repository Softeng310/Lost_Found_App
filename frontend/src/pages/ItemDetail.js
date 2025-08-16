import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import { getItemsClient } from '../lib/mock-data';
import { ArrowLeft, ShieldCheck } from '../components/ui/icons';

const ItemDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState(getItemsClient());
  const item = useMemo(() => items.find((i) => i.id === String(params?.id)), [items, params]);

  useEffect(() => {
    const id = setInterval(() => setItems(getItemsClient()), 2000);
    return () => clearInterval(id);
  }, []);

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-10">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-4 gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
        >
          <ArrowLeft />
          {"Back"}
        </button>
        <p className="text-muted-foreground">{"Item not found."}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
      <section className="space-y-4">
        <Link 
          to="/feed"
          className="gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
        >
          <ArrowLeft />
          {"Back to feed"}
        </Link>

        <div className="grid sm:grid-cols-[320px_1fr] gap-6">
          <img
            src={item.imageUrl || "/placeholder.svg"}
            width={320}
            height={240}
            alt={item.title}
            className="rounded-lg border aspect-video object-cover"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {item.kind}
              </Badge>
              <Badge className="bg-emerald-600 hover:bg-emerald-700">{item.category}</Badge>
              {item.reporter.trust && (
                <Badge variant="outline" className="gap-1">
                  <ShieldCheck />
                  {"Trusted"}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold">{item.title}</h1>
            <p className="text-muted-foreground mt-2">{item.description}</p>
            <div className="mt-4 text-sm">
              <p>
                <span className="font-medium">{"Location:"}</span>
                {` ${item.location}`}
              </p>
              <p>
                <span className="font-medium">{"Posted:"}</span>
                {` ${new Date(item.date).toLocaleString()}`}
              </p>
              <p>
                <span className="font-medium">{"Reporter:"}</span>
                {` ${item.reporter.name}`}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                {"Claim Item"}
              </button>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
                {"Message"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border-0 bg-white text-gray-900 shadow-sm">
          <div className="p-6 pt-0 p-4">
            <h3 className="font-medium mb-2">{"Safety & Verification"}</h3>
            <p className="text-sm text-muted-foreground">
              {"To verify ownership, be ready to share specific details such as color, engravings, or unique marks."}
            </p>
          </div>
        </div>
        <div className="rounded-lg border-0 bg-white text-gray-900 shadow-sm">
          <div className="p-6 pt-0 p-4">
            <h3 className="font-medium mb-2">{"Tips for Pickup"}</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>{"Meet in a public campus area."}</li>
              <li>{"Bring an ID if requested by the finder."}</li>
              <li>{"Confirm item details before handover."}</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ItemDetailPage;
