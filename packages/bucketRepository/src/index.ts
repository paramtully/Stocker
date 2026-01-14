import { CandleBucketRepository, CandleBucketS3Repository } from "./candle";
import { NewsBucketRepository, NewsBucketS3Repository } from "./news";

export { CandleBucketS3Repository, NewsBucketS3Repository, CandleBucketRepository, NewsBucketRepository };

/*
stocker-data/
├── news/
│   ├── raw/
│   │   └── historical/
│   │       └── historical.json
│   │       └── daily/
│   │           └── 2024-01-15_articles.json
│   └── processed/
│       └── historical/
│           └── historical.json
│       └── daily/
│           └── 2024-01-15_summaries.json
├── candles/
│   ├── historical/
│   │   └── historical.json
│   └── daily/
│       └── 2024-01-15_candles.json
├── metrics/
│   └── metrics/
│       └── 2024-01-15_metrics.json
└── backups/
    └── database/
        └── 2024-01-15_backup.sql
*/