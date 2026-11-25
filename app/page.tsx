"use client";

import { useCallback, useMemo, useState } from "react";
import AppHeader, { ROLES, type RoleId } from "@/components/common/AppHeader";
import BottomNav, { type CitizenTab } from "@/components/common/BottomNav";
import ComplaintFeed from "@/components/feed/ComplaintFeed";
import HomeChatIntake from "@/components/home/HomeChatIntake";
import GroupsShell from "@/components/groups/GroupsShell";
import MapView from "@/components/map/MapView";
import MyReportsView from "@/components/reports/MyReportsView";
import WorkerPortalView from "@/components/worker/WorkerPortalView";
import MayorPortalView from "@/components/mayor/MayorPortalView";
import { saveComplaint, updateComplaint, useComplaints } from "@/lib/data/storage";
import type { Complaint } from "@/lib/types";

export default function Page() {
  // Shared complaint state: seeded/persisted in localStorage. Every write in storage.ts
  // dispatches a change event, so Map, Explore, My Reports and portals re-sync instantly.
  const { complaints } = useComplaints();
  const [roleId, setRoleId] = useState<RoleId>("tariq");
  const [tab, setTab] = useState<CitizenTab>("home");
  // True when the last AI API call returned a DEMO-FALLBACK mock.
  const [offline, setOffline] = useState(false);
  const role = ROLES.find((r) => r.id === roleId) ?? ROLES[0];

  const onComplaintCreated = useCallback((c: Complaint) => {
    saveComplaint(c);
  }, []);

  const onUpdateComplaint = useCallback((c: Complaint) => {
    updateComplaint(c.id, c);
  }, []);

  const myComplaints = useMemo(
    () => complaints.filter((c) => c.reporter.citizenId === role.profileId),
    [complaints, role.profileId],
  );

  return (
    <>
      <AppHeader role={role} onRoleChange={setRoleId} offline={offline} />

      {role.kind === "citizen" ? (
        <>
          {/* pb-16 keeps content clear of the fixed bottom nav */}
          <main className="flex flex-1 flex-col pb-16">
            {tab === "explore" && (
              <ComplaintFeed viewerId={role.profileId} viewerName={role.name} homeSector={role.sector} onUpdateComplaint={onUpdateComplaint} />
            )}
            {tab === "map" && <MapView viewerId={role.profileId} viewerName={role.name} onUpdateComplaint={onUpdateComplaint} />}
            {tab === "home" && (
              <HomeChatIntake
                key={role.id}
                citizenName={role.name}
                citizenId={role.profileId}
                sector={role.sector}
                city="Islamabad"
                onComplaintCreated={onComplaintCreated}
                onFallbackChange={setOffline}
              />
            )}
            {tab === "reports" && (
              <MyReportsView
                complaints={myComplaints}
                onUpdateComplaint={onUpdateComplaint}
                citizenId={role.profileId}
                citizenName={role.name}
              />
            )}
            {tab === "groups" && <GroupsShell />}
          </main>
          <BottomNav active={tab} onChange={setTab} />
        </>
      ) : (
        <main className="flex flex-1 flex-col">
          {role.kind === "worker" ? (
            <WorkerPortalView complaints={complaints} onUpdateComplaint={onUpdateComplaint} />
          ) : (
            <MayorPortalView complaints={complaints} />
          )}
        </main>
      )}
    </>
  );
}
