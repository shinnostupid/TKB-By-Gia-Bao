/**
 * Collision Detection Math & Utilities for NEON DODGE
 * Supports circle-to-circle, line-segment-to-circle (laser beam),
 * and rotated ray collision detection.
 */
class CollisionManager {
    /**
     * Standard circle to circle intersection check
     */
    static circleIntersectsCircle(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distSq = dx * dx + dy * dy;
        const radSum = r1 + r2;
        return distSq <= (radSum * radSum);
    }

    /**
     * Checks if a circle (cx, cy, cr) intersects a line segment (x1, y1) -> (x2, y2) with a given thickness
     */
    static circleIntersectsLineSegment(cx, cy, cr, x1, y1, x2, y2, thickness = 6) {
        const lineDx = x2 - x1;
        const lineDy = y2 - y1;
        const lineLenSq = lineDx * lineDx + lineDy * lineDy;

        if (lineLenSq === 0) {
            return this.circleIntersectsCircle(cx, cy, cr, x1, y1, thickness / 2);
        }

        // Project center of circle onto line segment
        const t = Math.max(0, Math.min(1, ((cx - x1) * lineDx + (cy - y1) * lineDy) / lineLenSq));

        // Closest point on line segment
        const projX = x1 + t * lineDx;
        const projY = y1 + t * lineDy;

        const distDx = cx - projX;
        const distDy = cy - projY;
        const distSq = distDx * distDx + distDy * distDy;

        const effectiveRadius = cr + (thickness / 2);
        return distSq <= (effectiveRadius * effectiveRadius);
    }

    /**
     * Checks collision with a laser beam emanating from (originX, originY) at angle with length and beamWidth
     */
    static circleIntersectsRotatedBeam(cx, cy, cr, originX, originY, angle, length, beamWidth = 12) {
        const x2 = originX + Math.cos(angle) * length;
        const y2 = originY + Math.sin(angle) * length;
        return this.circleIntersectsLineSegment(cx, cy, cr, originX, originY, x2, y2, beamWidth);
    }

    /**
     * Normalize angle to [0, 2*PI)
     */
    static normalizeAngle(a) {
        let norm = a % (Math.PI * 2);
        if (norm < 0) norm += Math.PI * 2;
        return norm;
    }

    /**
     * Checks if a point is within a safe wedge/sector around the beacon
     */
    static isPointInSector(px, py, originX, originY, centerAngle, arcSpread) {
        const angleToPoint = Math.atan2(py - originY, px - originX);
        const normAngle = this.normalizeAngle(angleToPoint);
        const normCenter = this.normalizeAngle(centerAngle);

        let diff = Math.abs(normAngle - normCenter);
        if (diff > Math.PI) diff = (Math.PI * 2) - diff;

        return diff <= (arcSpread / 2);
    }
}

window.CollisionManager = CollisionManager;
