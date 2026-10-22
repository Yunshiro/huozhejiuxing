import { formatReport, simulate } from '../src/sim/run';

for (const row of simulate()) console.log(formatReport(row));
