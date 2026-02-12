import { supabase, CommunityReport } from '../lib/supabase';

export type ReportType = 'accident' | 'hazard' | 'police' | 'traffic' | 'construction' | 'road_closure';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

class CommunityService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  async createReport(
    reportType: ReportType,
    location: { lat: number; lng: number; address?: string },
    description: string,
    severity: Severity = 'medium',
    imageUrl?: string
  ): Promise<CommunityReport | null> {
    if (!this.userId) return null;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4);

    const { data, error } = await supabase
      .from('community_reports')
      .insert([
        {
          user_id: this.userId,
          report_type: reportType,
          location,
          description,
          severity,
          image_url: imageUrl,
          expires_at: expiresAt.toISOString(),
          status: 'active',
          upvotes: 0,
          downvotes: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return null;
    }

    return data;
  }

  async getNearbyReports(
    location: { lat: number; lng: number },
    radiusKm = 10
  ): Promise<CommunityReport[]> {
    try {
      const { data, error } = await supabase
        .from('community_reports')
        .select('*')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching reports:', error);
        return [];
      }

      return data.filter((report: CommunityReport) => {
        const distance = this.calculateDistance(location, report.location);
        return distance <= radiusKm;
      });
    } catch (error) {
      console.error('Exception fetching reports:', error);
      return [];
    }
  }

  async voteOnReport(reportId: string, voteType: 'upvote' | 'downvote'): Promise<boolean> {
    if (!this.userId) return false;

    const { data: existingVote } = await supabase
      .from('report_votes')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', this.userId)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        await supabase
          .from('report_votes')
          .delete()
          .eq('id', existingVote.id);

        await this.updateReportVoteCount(reportId, voteType, -1);
        return true;
      } else {
        await supabase
          .from('report_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        await this.updateReportVoteCount(reportId, existingVote.vote_type, -1);
        await this.updateReportVoteCount(reportId, voteType, 1);
        return true;
      }
    }

    const { error } = await supabase
      .from('report_votes')
      .insert([
        {
          report_id: reportId,
          user_id: this.userId,
          vote_type: voteType,
        },
      ]);

    if (!error) {
      await this.updateReportVoteCount(reportId, voteType, 1);
    }

    return !error;
  }

  private async updateReportVoteCount(
    reportId: string,
    voteType: 'upvote' | 'downvote',
    delta: number
  ): Promise<void> {
    const { data: report } = await supabase
      .from('community_reports')
      .select('upvotes, downvotes')
      .eq('id', reportId)
      .single();

    if (!report) return;

    const field = voteType === 'upvote' ? 'upvotes' : 'downvotes';
    const newValue = Math.max(0, report[field] + delta);

    await supabase
      .from('community_reports')
      .update({ [field]: newValue })
      .eq('id', reportId);
  }

  async markReportResolved(reportId: string): Promise<boolean> {
    const { error } = await supabase
      .from('community_reports')
      .update({ status: 'resolved' })
      .eq('id', reportId);

    return !error;
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371;
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.lat)) *
        Math.cos(this.deg2rad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  getReportIcon(reportType: ReportType): string {
    const icons: Record<ReportType, string> = {
      accident: '🚗💥',
      hazard: '⚠️',
      police: '🚓',
      traffic: '🚦',
      construction: '🚧',
      road_closure: '🚫',
    };
    return icons[reportType];
  }

  getReportColor(reportType: ReportType): string {
    const colors: Record<ReportType, string> = {
      accident: '#ef4444',
      hazard: '#f59e0b',
      police: '#3b82f6',
      traffic: '#f59e0b',
      construction: '#f97316',
      road_closure: '#dc2626',
    };
    return colors[reportType];
  }
}

export const communityService = new CommunityService();
