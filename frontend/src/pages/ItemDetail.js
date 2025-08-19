import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import { ArrowLeft, ShieldCheck } from '../components/ui/icons';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { normalizeFirestoreItem, buttonStyles, cardStyles } from '../lib/utils';

const ItemDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => {
    const itemId = String(params?.id || '');
    if (!itemId) return;
    const ref = doc(db, 'items', itemId);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data();
      if (!data) {
        setItem(null);
        return;
      }
      setItem(normalizeFirestoreItem(data, snapshot.id));
    });
    return () => unsubscribe();
  }, [params]);

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-10">
        <button 
          onClick={() => navigate(-1)} 
          className={`mb-4 gap-2 ${buttonStyles.base} ${buttonStyles.ghost}`}
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
          className={`gap-2 ${buttonStyles.base} ${buttonStyles.ghost}`}
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
              <button className={`${buttonStyles.base} ${buttonStyles.primary}`}>
                {"Claim Item"}
              </button>
              <button className={`${buttonStyles.base} ${buttonStyles.secondary}`}>
                {"Message"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className={cardStyles.base}>
          <div className="p-4">
            <h3 className="font-medium mb-2">{"Safety & Verification"}</h3>
            <p className="text-sm text-muted-foreground">
              {"To verify ownership, be ready to share specific details such as color, engravings, or unique marks."}
            </p>
          </div>
        </div>
        <div className={cardStyles.base}>
          <div className="p-4">
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
