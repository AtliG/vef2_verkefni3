export function getDate(timestamp) {
  const myRe = new RegExp('[0-9]{4}-[0-9]{2}-[0-9]{2}', 'g');
  myRe.lastIndex = 0;

  const result = myRe.exec(timestamp);

  const date = result[0];

  return `${date.substring(8)}.${date.substring(5, 7)}.${date.substring(0, 4)}`;
}
