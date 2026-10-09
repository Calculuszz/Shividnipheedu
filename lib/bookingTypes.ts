// Shapes of everything /api/booking/* and /api/staff/* send back.
// Source of truth: the route handlers in app/api and docs/booking-api.pdf.

export type ActivityId = 'escape_room' | 'haunted_house' | (string & {});

export type BookingPhase = 'not_open' | 'open' | 'closed';

export type RoundStatus = 'available' | 'full' | 'closed' | 'walkin_available' | 'in_progress' | 'ended';

// 'released' = booked but missed check-in (worked out from the clock, not stored)
export type PlayerStatus = 'booked' | 'checked_in' | 'released' | 'cancelled' | 'removed';

export type WalkinStatus = 'queued' | 'checked_in' | 'left';

// ---- Student side ----

export interface ActivityInfo {
  id: ActivityId;
  name: string;
  room_name: string | null;
  details_md: string | null;
  rules_md: string | null;
  health_notice: string | null;
  team_min: number;
  team_max: number;
  /** Default seats per round: online booking + walk-in (12 + 3 = 15 players / round) */
  online_seats: number;
  walkin_seats: number;
  checkin_opens_before_min: number;
  checkin_duration_min: number;
  booking_opens_at: string | null;
  booking_closes_at: string | null;
}

export interface BookingStateResponse {
  state: BookingPhase;
  now: string;
  activity: ActivityInfo;
}

export interface Round {
  id: string;
  round_no: number;
  starts_at: string;
  ends_at: string;
  checkin_opens_at: string;
  checkin_closes_at: string;
  closed: boolean;
  closed_reason: string | null;
  online_cap: number;
  online_left: number;
  walkin_left: number;
  round_status: RoundStatus;
}

export interface RoundsResponse {
  rounds: Round[];
  updated_at: string;
}

export interface PlayerInput {
  student_id: string;
  full_name: string;
  phone: string;
  email: string;
  pdpa: boolean;
  rules: boolean;
  /** Haunted House asks for these too */
  nickname?: string;
  faculty?: string;
  year?: string;
}

export interface BookRequest {
  round_id: string;
  players: PlayerInput[]; // first player is the leader
  notes?: string;
}

export interface BookResult {
  booking_id: string;
  round_id: string;
  code: string; // the leader's own code only
  players: { full_name: string; is_leader: boolean }[];
}

export interface TeamMember {
  id: string;
  full_name: string;
  is_leader: boolean;
  status: PlayerStatus;
  is_me: boolean;
}

export interface MyBooking {
  me: {
    id: string;
    code: string;
    full_name: string;
    is_leader: boolean;
    status: PlayerStatus;
    checked_in_at: string | null;
  };
  activity: { id: ActivityId; name: string; room_name: string | null; booking_closes_at: string | null } | null;
  round: {
    id: string;
    round_no: number;
    starts_at: string;
    ends_at: string;
    checkin_opens_at: string;
    checkin_closes_at: string;
  };
  booking: { status: 'active' | 'cancelled'; notes?: string | null };
  team: TeamMember[];
  can: {
    change_round: boolean;
    cancel_seat: boolean;
    cancel_team: boolean;
    remove_member: boolean;
  };
}

export interface CancelSeatResult {
  cancelled: true;
  new_leader: { id: string; full_name: string } | null;
}

// ---- Staff side ----

export interface StaffRound extends Round {
  activity_id: ActivityId;
  walkin_cap: number;
  booking_opens_at: string | null;
  booking_closes_at: string | null;
  booking_closed: boolean;
  online_taken: number;
  checked_in: number;
  released: number;
  cancelled_late: number;
  walkin_in: number;
  walkin_queued: number;
}

export interface StaffPlayer {
  id: string;
  booking_id: string;
  round_id: string;
  round_no: number;
  position: number;
  is_leader: boolean;
  student_id: string;
  full_name: string;
  phone: string;
  live_status: PlayerStatus;
  checked_in_at: string | null;
  checkin_opens_at: string;
  checkin_closes_at: string;
}

export interface Walkin {
  id: string;
  queue_no: number;
  student_id: string;
  full_name: string;
  phone: string;
  status: WalkinStatus;
  created_at: string;
  checked_in_at: string | null;
}

export interface AttendanceResponse {
  round: StaffRound;
  players: StaffPlayer[];
  notes: Record<string, string>; // booking_id -> team notes
  walkins: Walkin[];
  now: string;
}
