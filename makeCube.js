import { Mesh, BoxGeometry, MeshLambertMaterial } from 'three'

const makeCube = size => {
  return new Mesh(
    new BoxGeometry(sz, sz, sz),
    new MeshLambertMaterial({ color: 0xff0000 }),
  );
};

export { makeCube }
