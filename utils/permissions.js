/**
 * Permission system for commands
 * @module utils/permissions
 */

const logger = require('./logger');

class PermissionManager {
  constructor() {
    // Define role hierarchy (highest to lowest)
    this.roleHierarchy = {
      OWNER: 5,
      ADMIN: 4,
      MODERATOR: 3,
      VIP: 2,
      MEMBER: 1,
      EVERYONE: 0
    };

    // Define role IDs (update with your server's role IDs)
    this.roleIds = {
      OWNER: null, // Will check ownership
      ADMIN: null, // Add your admin role ID
      MODERATOR: null, // Add your moderator role ID
      VIP: null, // Add your VIP role ID
      MEMBER: null, // Add your member role ID
    };
  }

  /**
   * Get user's highest role level
   */
  getUserRoleLevel(member) {
    if (member.guild.ownerId === member.id) {
      return this.roleHierarchy.OWNER;
    }

    if (member.permissions.has('Administrator')) {
      return this.roleHierarchy.ADMIN;
    }

    if (member.permissions.has('ModerateMembers')) {
      return this.roleHierarchy.MODERATOR;
    }

    // Check custom roles
    const roles = member.roles.cache;
    
    if (this.roleIds.VIP && roles.has(this.roleIds.VIP)) {
      return this.roleHierarchy.VIP;
    }

    if (this.roleIds.MEMBER && roles.has(this.roleIds.MEMBER)) {
      return this.roleHierarchy.MEMBER;
    }

    return this.roleHierarchy.EVERYONE;
  }

  /**
   * Check if user has required permission
   */
  hasPermission(member, requiredLevel) {
    const userLevel = this.getUserRoleLevel(member);
    return userLevel >= requiredLevel;
  }

  /**
   * Check if user is owner
   */
  isOwner(member) {
    return member.guild.ownerId === member.id;
  }

  /**
   * Check if user is admin
   */
  isAdmin(member) {
    return this.getUserRoleLevel(member) >= this.roleHierarchy.ADMIN;
  }

  /**
   * Check if user is moderator or higher
   */
  isModerator(member) {
    return this.getUserRoleLevel(member) >= this.roleHierarchy.MODERATOR;
  }

  /**
   * Check if user is VIP or higher
   */
  isVIP(member) {
    return this.getUserRoleLevel(member) >= this.roleHierarchy.VIP;
  }

  /**
   * Get role name from level
   */
  getRoleName(level) {
    return Object.keys(this.roleHierarchy).find(
      key => this.roleHierarchy[key] === level
    ) || 'UNKNOWN';
  }

  /**
   * Get user's role name
   */
  getUserRoleName(member) {
    const level = this.getUserRoleLevel(member);
    return this.getRoleName(level);
  }
}

module.exports = new PermissionManager();
