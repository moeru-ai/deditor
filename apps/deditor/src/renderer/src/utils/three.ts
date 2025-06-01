import * as THREE from 'three'

export function toVec3s(points: number[][], normalizedAbsMax: number | undefined = 5): THREE.Vector3[] {
  const vec3s = points.map(point => new THREE.Vector3(...point))

  if (normalizedAbsMax) {
    if (normalizedAbsMax <= 0) {
      throw new Error('Expected `normalizedAbsMax` to be a positive number')
    }

    // Scale to fit into the below bounding box:
    // [
    //  -normalizedAbsMax, -normalizedAbsMax, -normalizedAbsMax
    //  normalizedAbsMax,  normalizedAbsMax,  normalizedAbsMax
    // ]
    const box = new THREE.Box3().setFromPoints(vec3s)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxD = Math.max(size.x, size.y, size.z)
    vec3s.forEach((point) => {
      point.sub(center)
      point.divideScalar(maxD / normalizedAbsMax * 2)
    })
  }

  return vec3s
}
