
// Hooks.once("canvasReady", () => {
//     // Save a reference to the original function
//     const originalGetSegmentStyle = Ruler.prototype._getSegmentStyle;

//     Ruler.prototype._getSegmentStyle = function (
//         waypoint: any // Should be DeepReadonly<RulerWaypoint>, but we can use any here for compatibility
//     ) {
//         // Call the original method first to get base style
//         const style = originalGetSegmentStyle.call(this, waypoint);

//         // --- Your custom logic below ---

//         // Find the token being measured from
//         const token = getOriginToken(this);
//         const actor: any = token?.actor;
//         const speed = actor?.system?.combat?.speed ?? null;

//         if (speed && this.waypoints && this.waypoints.length > 1) {
//             // Figure out which segment this is
//             const idx = this.waypoints.findIndex((wp: any) => wp === waypoint);
//             if (idx > 0) {
//                 // Sum the total distance up to this segment
//                 let runningTotal = 0;
//                 for (let i = 1; i <= idx; i++) {
//                     runningTotal += this.measure([this.waypoints[i - 1], this.waypoints[i]], { gridSpaces: true });
//                 }

//                 // Color segments based on threshold
//                 if (runningTotal > speed * 2) {
//                     style.color = "#FF3333"; // red
//                 } else if (runningTotal > speed) {
//                     style.color = "#FFFF33"; // yellow
//                 } else {
//                     style.color = "#33FF33"; // green
//                 }
//             }
//         }
//         return style;
//     };
// });

// function getOriginToken(ruler: Ruler): Token | undefined {
//     const [origin] = ruler.waypoints;
//     if (!origin) return undefined;
//     const tokens = canvas.tokens?.placeables ?? [];
//     let minDist = Infinity;
//     let closest: Token | undefined;
//     for (const t of tokens) {
//         const dx = t.center.x - origin.x;
//         const dy = t.center.y - origin.y;
//         const dist = Math.sqrt(dx * dx + dy * dy);
//         if (dist < minDist && dist < t.w / 2) {
//             minDist = dist;
//             closest = t;
//         }
//     }
//     return closest;
// }