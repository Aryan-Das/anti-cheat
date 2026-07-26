
export function detectHit(shooter_position: {x: number, y: number}, aim_angle: number, target_position: {x:number, y: number}, max_range: number, hit_radius: number) : {hit: boolean, perpendicular_dist: number, distance_along_ray: number} {
    const dir = {x: Math.cos(aim_angle), y: Math.sin(aim_angle)};
    const shooter_to_target = {
        x: target_position.x - shooter_position.x , 
        y:  target_position.y - shooter_position.y 

    };
    const dot = (shooter_to_target.x * dir.x) + (shooter_to_target.y * dir.y);
    if (dot < 0 || dot > max_range){
        return {
            hit: false,
            perpendicular_dist: -1,
            distance_along_ray: -1
        };
    }
    const closestPoint = {
        x: shooter_position.x + dir.x * dot,
        y: shooter_position.y + dir.y * dot
    }; 
    const perpendicularDistance = Math.hypot(target_position.x - closestPoint.x, target_position.y - closestPoint.y);
    return {hit: perpendicularDistance <= hit_radius, perpendicular_dist: perpendicularDistance, distance_along_ray: dot}

}

export function computeRayEndPoint(origin: {x: number, y:number}, angle: number, max_distance: number) : {x: number, y: number} {
    const dir = {x: Math.cos(angle), y: Math.sin(angle)};
    return {
        x: origin.x + dir.x * max_distance,
        y: origin.y + dir.y * max_distance
    };


}
