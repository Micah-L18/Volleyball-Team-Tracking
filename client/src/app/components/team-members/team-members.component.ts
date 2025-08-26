import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeamMemberService, TeamMember } from '../../services/team-member.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="team-members-container">
      <div class="page-header">
        <h2>Team Members</h2>
        <p class="text-muted">Manage team member roles and access</p>
      </div>

      <div class="loading-spinner" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading team members...</p>
      </div>

      <div class="members-list" *ngIf="!loading">
        <div class="member-card" *ngFor="let member of members">
          <div class="member-info">
            <div class="member-avatar">
              <span>{{ getInitials(member.first_name, member.last_name) }}</span>
            </div>
            
            <div class="member-details">
              <h4>{{ member.first_name }} {{ member.last_name }}</h4>
              <p class="email">{{ member.email }}</p>
              
              <div class="player-info" *ngIf="member.player_first_name">
                <small class="text-muted">
                  Player: {{ member.player_first_name }} {{ member.player_last_name }}
                  <span *ngIf="member.jersey_number">#{{ member.jersey_number }}</span>
                </small>
              </div>
            </div>
          </div>

          <div class="member-actions">
            <div class="role-section">
              <span 
                class="role-badge" 
                [ngClass]="teamMemberService.getRoleBadgeClass(member.role)">
                {{ teamMemberService.getRoleDisplayName(member.role) }}
              </span>
              
              <div class="role-controls" *ngIf="canEditRoles && !member.editingRole">
                <button 
                  class="btn btn-sm btn-outline"
                  (click)="startEditRole(member)"
                  [disabled]="editingMemberId === member.id">
                  <i class="icon-edit"></i>
                  Edit Role
                </button>
              </div>

              <div class="role-editor" *ngIf="member.editingRole">
                <select 
                  [(ngModel)]="member.newRole" 
                  class="form-select form-select-sm">
                  <option 
                    *ngFor="let role of availableRoles" 
                    [value]="role.value">
                    {{ role.label }}
                  </option>
                </select>
                
                <div class="editor-actions">
                  <button 
                    class="btn btn-sm btn-success"
                    (click)="saveRole(member)"
                    [disabled]="savingRole">
                    <i class="icon-check"></i>
                    Save
                  </button>
                  <button 
                    class="btn btn-sm btn-secondary"
                    (click)="cancelEditRole(member)">
                    <i class="icon-x"></i>
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <div class="member-status">
              <span 
                class="status-badge"
                [ngClass]="{
                  'status-accepted': member.status === 'accepted',
                  'status-pending': member.status === 'pending',
                  'status-declined': member.status === 'declined'
                }">
                {{ getStatusDisplayName(member.status) }}
              </span>
            </div>

            <div class="danger-zone" *ngIf="canEditRoles && member.role !== 'head_coach'">
              <button 
                class="btn btn-sm btn-danger"
                (click)="confirmRemoveMember(member)"
                [disabled]="removingMemberId === member.id">
                <i class="icon-trash"></i>
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="members.length === 0">
          <i class="icon-users"></i>
          <h3>No team members found</h3>
          <p>Invite users to join your team to get started.</p>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div class="modal" *ngIf="memberToRemove" (click)="cancelRemoveMember()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Remove Team Member</h3>
          <p>
            Are you sure you want to remove 
            <strong>{{ memberToRemove.first_name }} {{ memberToRemove.last_name }}</strong> 
            from the team?
          </p>
          <p class="text-danger">This action cannot be undone.</p>
          
          <div class="modal-actions">
            <button 
              class="btn btn-danger"
              (click)="removeMember()"
              [disabled]="removingMemberId === memberToRemove.id">
              <i class="icon-trash"></i>
              Remove Member
            </button>
            <button 
              class="btn btn-secondary"
              (click)="cancelRemoveMember()">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div class="alert alert-success" *ngIf="successMessage">
        <i class="icon-check-circle"></i>
        {{ successMessage }}
      </div>

      <div class="alert alert-error" *ngIf="errorMessage">
        <i class="icon-alert-circle"></i>
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .team-members-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 20px;
    }

    .page-header h2 {
      margin: 0 0 10px 0;
      color: #2c3e50;
    }

    .loading-spinner {
      text-align: center;
      padding: 40px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .member-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .member-info {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .member-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #3498db;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      margin-right: 15px;
    }

    .member-details h4 {
      margin: 0 0 5px 0;
      color: #2c3e50;
    }

    .member-details .email {
      margin: 0 0 5px 0;
      color: #7f8c8d;
    }

    .player-info {
      color: #27ae60;
    }

    .member-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .role-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .badge-primary { background: #3498db; color: white; }
    .badge-secondary { background: #95a5a6; color: white; }
    .badge-success { background: #27ae60; color: white; }
    .badge-info { background: #17a2b8; color: white; }

    .role-controls, .role-editor {
      margin-top: 10px;
    }

    .role-editor {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .form-select-sm {
      padding: 4px 8px;
      font-size: 12px;
    }

    .editor-actions {
      display: flex;
      gap: 5px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }

    .status-accepted { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-declined { background: #f8d7da; color: #721c24; }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: background-color 0.2s;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #ddd;
      color: #333;
    }

    .btn-outline:hover {
      background: #f8f9fa;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover {
      background: #218838;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
    }

    .modal-content h3 {
      margin-top: 0;
      color: #2c3e50;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 4px;
      margin: 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #7f8c8d;
    }

    .empty-state i {
      font-size: 48px;
      margin-bottom: 20px;
      display: block;
    }

    .text-muted {
      color: #6c757d;
    }

    .text-danger {
      color: #dc3545;
    }
  `]
})
export class TeamMembersComponent implements OnInit, OnDestroy {
  members: (TeamMember & { editingRole?: boolean; newRole?: string })[] = [];
  loading = false;
  canEditRoles = false;
  editingMemberId: number | null = null;
  savingRole = false;
  removingMemberId: number | null = null;
  memberToRemove: TeamMember | null = null;
  successMessage = '';
  errorMessage = '';
  teamId!: number;
  availableRoles: Array<{ value: string; label: string }> = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    public teamMemberService: TeamMemberService,
    private authService: AuthService
  ) {
    this.availableRoles = this.teamMemberService.getAvailableRoles();
  }

  ngOnInit(): void {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.teamId) {
      this.loadTeamMembers();
      this.checkUserPermissions();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadTeamMembers(): void {
    this.loading = true;
    this.clearMessages();

    const subscription = this.teamMemberService.getTeamMembers(this.teamId).subscribe({
      next: (members) => {
        this.members = members.map(member => ({ ...member, editingRole: false }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading team members:', error);
        this.errorMessage = 'Failed to load team members';
        this.loading = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  private checkUserPermissions(): void {
    // Subscribe to current user to get their information
    const subscription = this.authService.getCurrentUser().subscribe({
      next: (currentUser) => {
        if (currentUser) {
          const userMember = this.members.find(m => m.user_id === currentUser.id);
          this.canEditRoles = this.teamMemberService.canEditRoles(userMember?.role || '');
        }
      },
      error: (error) => {
        console.error('Error getting current user:', error);
      }
    });

    this.subscriptions.push(subscription);
  }

  startEditRole(member: TeamMember & { editingRole?: boolean; newRole?: string }): void {
    if (this.editingMemberId) return;
    
    member.editingRole = true;
    member.newRole = member.role;
    this.editingMemberId = member.id;
  }

  cancelEditRole(member: TeamMember & { editingRole?: boolean; newRole?: string }): void {
    member.editingRole = false;
    member.newRole = undefined;
    this.editingMemberId = null;
  }

  saveRole(member: TeamMember & { editingRole?: boolean; newRole?: string }): void {
    if (!member.newRole || this.savingRole) return;

    this.savingRole = true;
    this.clearMessages();

    const subscription = this.teamMemberService.updateMemberRole(
      this.teamId, 
      member.id, 
      member.newRole
    ).subscribe({
      next: (response) => {
        member.role = member.newRole as any;
        member.editingRole = false;
        member.newRole = undefined;
        this.editingMemberId = null;
        this.savingRole = false;
        this.successMessage = response.message;
        this.autoHideMessage();
      },
      error: (error) => {
        console.error('Error updating member role:', error);
        this.errorMessage = error.error?.error || 'Failed to update member role';
        this.savingRole = false;
        this.autoHideMessage();
      }
    });

    this.subscriptions.push(subscription);
  }

  confirmRemoveMember(member: TeamMember): void {
    this.memberToRemove = member;
  }

  cancelRemoveMember(): void {
    this.memberToRemove = null;
  }

  removeMember(): void {
    if (!this.memberToRemove || this.removingMemberId) return;

    this.removingMemberId = this.memberToRemove.id;
    this.clearMessages();

    const subscription = this.teamMemberService.removeMember(
      this.teamId,
      this.memberToRemove.id
    ).subscribe({
      next: (response) => {
        this.members = this.members.filter(m => m.id !== this.memberToRemove!.id);
        this.successMessage = response.message;
        this.memberToRemove = null;
        this.removingMemberId = null;
        this.autoHideMessage();
      },
      error: (error) => {
        console.error('Error removing member:', error);
        this.errorMessage = error.error?.error || 'Failed to remove member';
        this.removingMemberId = null;
        this.autoHideMessage();
      }
    });

    this.subscriptions.push(subscription);
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'accepted': 'Active',
      'pending': 'Pending',
      'declined': 'Declined'
    };
    return statusMap[status] || status;
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private autoHideMessage(): void {
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }
}
