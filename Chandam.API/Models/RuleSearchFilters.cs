using System.Collections.Generic;

namespace Chandam.API.Models
{
    /// <summary>
    /// Filter parameters for searching and filtering Chandam rules
    /// Matches existing UI grouping logic from rule-grouping.ts
    /// </summary>
    public class RuleSearchFilters
    {
        /// <summary>Search term for Telugu rule name (exact or partial match)</summary>
        public string? Query { get; set; }

        /// <summary>Filter by PadyamSubType categories (Akkara, Divpada, Jati, Vruttam, etc.) - Primary filter matching UI grouping</summary>
        public List<string>? Categories { get; set; }

        /// <summary>Filter by Chandam names for Vruttam subtype (గాయత్రి, త్రిష్టుప్పు, అనుష్టుప్, etc.)</summary>
        public List<string>? ChandamNames { get; set; }

        /// <summary>Filter by PadyamSubType (Akkara, Divpada, Ragada, etc.) - Kept for backward compatibility, maps to Categories</summary>
        public List<string>? SubTypes { get; set; }

        /// <summary>Minimum matra length (-1 excluded) - Independent of character length</summary>
        public int? MatraLengthMin { get; set; }

        /// <summary>Maximum matra length (-1 excluded) - Independent of character length</summary>
        public int? MatraLengthMax { get; set; }

        /// <summary>Filter by examples: true=with examples, false=without, null=all</summary>
        public bool? HasExamples { get; set; }

        /// <summary>Filter by frequency (Frequent, Rare)</summary>
        public List<string>? Frequencies { get; set; }

        /// <summary>Maximum results (0 = unlimited)</summary>
        public int MaxResults { get; set; } = 0;
    }
}
