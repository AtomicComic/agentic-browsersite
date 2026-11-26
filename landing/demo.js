const frames = [
  ['Restaurant journal','The dish worth crossing town for.','A critic recommends the saffron pasta at Linden Room.','Checking the menu and reservation calendar…'],
  ['OpenTable · Linden Room','First table at 10:15 PM.','Pasta for two · $78','Too late. Checking the next restaurant…'],
  ['Dinner menu · Juniper Table','Roast chicken for two.','$84 before tax and tip. Recommended in the sample review.','Within budget. Checking a table for two…'],
  ['Resy · Juniper Table','7:15 PM is available.','Party of two · Reserve table','Selecting the sample reservation…'],
  ['Resy · Juniper Table','Reserve table','Juniper Table · Table for two · 7:15 PM','Confirming the sample booking…'],
  ['Reservation confirmation','Your table is confirmed.','Juniper Table · 7:15 PM · Party of two','Sample booking complete.']
];
const ids = ['source','headline','detail','status'];
const button = document.querySelector('#play');
let timer;
let index = 0;
function render() {
  ids.forEach((id, i) => document.getElementById(id).textContent = frames[index][i]);
  document.querySelector('#step').textContent = '0' + (index + 1) + ' / 06';
}
function pause() {
  clearInterval(timer);
  timer = undefined;
  button.textContent = index === frames.length - 1 ? 'Replay' : 'Play demo';
}
function play() {
  if (index === frames.length - 1) index = 0;
  render();
  button.textContent = 'Pause';
  timer = setInterval(() => {
    index++;
    render();
    if (index === frames.length - 1) pause();
  }, 1600);
}
button.addEventListener('click', () => timer ? pause() : play());
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) play();
