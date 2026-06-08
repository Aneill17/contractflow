alter table contracts
  add column if not exists hotel_comparable_rate integer default 0;
  -- stores nightly hotel/Airbnb comparable rate in dollars e.g. 189
