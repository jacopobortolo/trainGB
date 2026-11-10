# trainGB

Small helper for the Great Britain map of [RailPulse](https://railpulse.ch/uk).

Once an hour it downloads the *Darwin Real Time Train Information snapshot* from the Rail Data Marketplace,
keeps one number per running train (delay in minutes) and uploads the result to railpulse.ch.

- `uk_snap.py` – the script (keys are read from the environment, never stored here)
- `.github/workflows/snap.yml` – the job, started on demand

Data: National Rail Enquiries (Darwin), via Rail Data Marketplace. Independent project, not affiliated with National Rail.
