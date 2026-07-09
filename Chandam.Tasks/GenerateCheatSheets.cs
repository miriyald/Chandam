//---------------------------------------------------------------------------------------------
// <copyright file="GenerateCheatSheets.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
// </copyright>
//---------------------------------------------------------------------------------------------

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Chandam.API.Services;
using Chandam.Rules;
using Chandam.Util;

namespace Verifier
{
	/// <summary>
	/// Generates one standalone, self-contained HTML cheat sheet per rule set (chandam, topella,
	/// sanskrit, jkmr — the datasets defined in Chandam.Wasm/Client/src/config.ts RULE_SETS), plus a
	/// combined cheatsheets.xlsx workbook (one sheet per rule set). Each table is
	/// CheatSheet.BuildCheatSheet2 with an extra "గణ శ్రేణి" (gaNa laghu/guru sequence) column.
	/// Styling matches the legacy reference at https://chandamu.github.io/ChaMdOraajaM.html
	/// (laghu=green, guru=blue, gName=red).
	/// </summary>
	internal class GenerateCheatSheets
	{
		private readonly string _outputDirectory;
		private readonly string _rulesDirectory;

		private const string FooterNote = "ఛందం© తో పద్య సాహిత్యం మరింత రసమయం..!!";

		/// <summary>
		/// The rule sets, one file each. ids and Telugu names mirror config.ts RULE_SETS.
		/// </summary>
		private static readonly (string Id, string Name)[] RuleSets =
		{
			( "chandam",  "చంధోరత్నావళి" ),
			( "topella",  "అనంతచ్ఛందస్సౌరభము" ),
			( "sanskrit", "సంస్కృత ఛందస్సులు" ),
			( "jkmr",     "జెజ్జాల కృష్ణ మోహన రావు సేకరణ" ),
		};

		public GenerateCheatSheets(string outputDirectory, string rulesDirectory)
		{
			_outputDirectory = outputDirectory;
			_rulesDirectory = rulesDirectory;
		}

		/// <summary>
		/// Generate one cheat sheet file per rule set plus an index.html.
		/// </summary>
		public void GenerateAll()
		{
			Directory.CreateDirectory(_outputDirectory);

			var loader = new RuleLoaderService(_rulesDirectory);
			loader.LoadAllRuleSets();

			var index = new StringBuilder();
			index.Append("<ul class='toc-list'>");

			using var workbook = new XLWorkbook();

			foreach (var set in RuleSets)
			{
				// Skip the synthetic GenricVruttam catch-all appended by the loader.
				List<Rule> rules = loader.GetRulesForRuleSet(set.Id)
					.Where(r => r.PadyamSubType != PadyamSubType.GenricVruttam)
					.ToList();

				int count = WriteRuleSet(set.Id, set.Name, rules, workbook);
				index.Append($"<li><a href='{set.Id}.html'>{set.Name}</a> ({count})</li>");
			}

			index.Append("</ul>");
			WriteIndex(index.ToString());

			string xlsxPath = Path.Combine(_outputDirectory, "cheatsheets.xlsx");
			workbook.SaveAs(xlsxPath);
			Console.ForegroundColor = ConsoleColor.Green;
			Console.WriteLine($"  ✓ cheatsheets.xlsx ({RuleSets.Length} sheets, {GetFileSize(xlsxPath)})");
			Console.ResetColor();
		}

		/// <summary>
		/// Write a single rule-set file (summary table with the extra gaNa-sequence column) and add
		/// a matching worksheet to the workbook. If there are no rules, still emit a placeholder file.
		/// </summary>
		private int WriteRuleSet(string id, string name, List<Rule> rules, XLWorkbook workbook)
		{
			if (rules == null || rules.Count == 0)
			{
				Console.ForegroundColor = ConsoleColor.Yellow;
				Console.WriteLine($"  ! {name} ({id}): no rules found — emitting placeholder file");
				Console.ResetColor();
				WriteFile(id, name, "<p class='empty'>ఈ నియమావళికి నియమములు అందుబాటులో లేవు.</p>", 0);
				return 0;
			}

			// Order short meters first, matching the legacy cheat sheet layout.
			Rule[] sorted = SortHelper.SortByCharLength(rules);

			// CheatSheet.BuildCheatSheet2 now emits the గణ శ్రేణి column, the desired column order
			// (rules | gaNa sequence | matra sequence | example), and is null-safe for DTO-loaded
			// rules — so we render it directly and parse it for Excel.
			string table = CheatSheet.BuildCheatSheet2(false, true, sorted);

			WriteFile(id, name, table, sorted.Length);

			// Excel sheet: same columns/order as the HTML table, as plain text.
			AddWorksheet(workbook, id, ParseTable(table));

			return sorted.Length;
		}

		// -------------------------------------------------------------------------------------
		// Excel
		// -------------------------------------------------------------------------------------

		/// <summary>Parse a cheat-sheet HTML table into rows of plain-text cells (header first).</summary>
		private static List<string[]> ParseTable(string tableHtml)
		{
			var rows = new List<string[]>();

			var thead = Regex.Match(tableHtml, "<thead>(.*?)</thead>", RegexOptions.Singleline);
			if (thead.Success)
			{
				rows.Add(ExtractCells(thead.Groups[1].Value, "th"));
			}

			var tbody = Regex.Match(tableHtml, "<tbody>(.*?)</tbody>", RegexOptions.Singleline);
			if (tbody.Success)
			{
				foreach (Match tr in Regex.Matches(tbody.Groups[1].Value, "<tr>(.*?)</tr>", RegexOptions.Singleline))
				{
					rows.Add(ExtractCells(tr.Groups[1].Value, "td"));
				}
			}

			return rows;
		}

		private static string[] ExtractCells(string rowHtml, string tag)
		{
			var cells = new List<string>();
			foreach (Match m in Regex.Matches(rowHtml, "<" + tag + "\\b[^>]*>(.*?)</" + tag + ">", RegexOptions.Singleline))
			{
				cells.Add(HtmlToText(m.Groups[1].Value));
			}
			return cells.ToArray();
		}

		/// <summary>Add one worksheet per rule set, populated from the parsed table rows.</summary>
		private static void AddWorksheet(XLWorkbook workbook, string sheetName, List<string[]> rows)
		{
			var ws = workbook.Worksheets.Add(sheetName);

			for (int r = 0; r < rows.Count; r++)
			{
				string[] cells = rows[r];
				for (int c = 0; c < cells.Length; c++)
				{
					ws.Cell(r + 1, c + 1).Value = cells[c];
				}
			}

			if (rows.Count > 0)
			{
				ws.Row(1).Style.Font.Bold = true;
				ws.SheetView.FreezeRows(1);
				var used = ws.RangeUsed();
				if (used != null)
				{
					used.Style.Alignment.WrapText = true;
					used.Style.Alignment.Vertical = XLAlignmentVerticalValues.Top;
				}
				ws.Columns().Width = 22;
			}
		}

		/// <summary>Strip HTML from a table cell to plain text, keeping list/line breaks as newlines.</summary>
		private static string HtmlToText(string html)
		{
			html = html
				.Replace("</li>", "\n")
				.Replace("<br/>", "\n")
				.Replace("<br />", "\n")
				.Replace("<br>", "\n");
			html = Regex.Replace(html, "<[^>]+>", "");
			html = html
				.Replace("&nbsp;", " ")
				.Replace("&amp;", "&")
				.Replace("&lt;", "<")
				.Replace("&gt;", ">");
			// Collapse runs of spaces/blank lines introduced by tag removal.
			html = Regex.Replace(html, "[ \\t]+", " ");
			html = Regex.Replace(html, "\n{3,}", "\n\n");
			return html.Trim();
		}

		private void WriteFile(string id, string name, string content, int count)
		{
			string html = BuildHtmlDocument(name, content);
			string path = Path.Combine(_outputDirectory, id + ".html");
			File.WriteAllText(path, html, Encoding.UTF8);

			Console.ForegroundColor = ConsoleColor.Green;
			Console.WriteLine($"  ✓ {id}.html — {name} ({count} rules, {GetFileSize(path)})");
			Console.ResetColor();
		}

		private void WriteIndex(string tocList)
		{
			string body = "<div class='toc'>" + tocList + "</div>";
			string html = BuildHtmlDocument("ఛందం - నియమావళులు", body);
			string path = Path.Combine(_outputDirectory, "index.html");
			File.WriteAllText(path, html, Encoding.UTF8);

			Console.ForegroundColor = ConsoleColor.Green;
			Console.WriteLine($"  ✓ index.html ({GetFileSize(path)})");
			Console.ResetColor();
		}

		/// <summary>
		/// Wrap content in a full standalone HTML document with inlined CSS matching the
		/// legacy reference page.
		/// </summary>
		private static string BuildHtmlDocument(string head, string content)
		{
			string timestamp = DateTime.Now.ToString("dd-MMM-yyyy HH:mm");
			return
				"<!DOCTYPE html>\n" +
				"<html lang=\"te\"><head><meta charset=\"utf-8\">\n" +
				"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
				"<title>" + head + " — ఛందం CheatSheet</title>\n" +
				"<style>" + InlineCss + "</style></head>\n" +
				"<body><h1>" + head + "</h1>\n" +
				content + "\n" +
				"<footer><p class='note'>" + FooterNote + "</p>" +
				"<p class='meta'>Generated: " + timestamp + "</p></footer>\n" +
				"</body></html>";
		}

		/// <summary>
		/// Inlined stylesheet. Table/colour rules copied from the legacy Obsolete/Web/css/Chandam.css
		/// (the stylesheet behind the reference page); base typography from the Wasm export-book.
		/// </summary>
		private const string InlineCss = @"
			* { box-sizing: border-box; }
			body {
				font-family: 'Anek Telugu', 'Noto Sans Telugu', sans-serif;
				color: #1a1a1a; line-height: 1.6; margin: 0 auto; padding: 2rem;
				max-width: 1200px; background: #fff;
			}
			h1 { font-size: 2.2rem; margin-bottom: 1rem; }
			h2 { font-size: 1.5rem; margin: 1.5rem 0 0.75rem; border-bottom: 2px solid #ccc; padding-bottom: 0.3rem; }

			/* Legacy laghu/guru/gName palette (Chandam.css:942,947,162) */
			.laghu { color: Green; font-weight: bold; }
			.guru { color: Blue; font-weight: bold; }
			.gName { color: Red; font-weight: bold; }

			/* Legacy cheat-sheet table (Chandam.css .sort-table / .errTab2) */
			#CheatSheet, .sort-table, .errTab2 {
				border: solid 1px #CCCCCC; border-collapse: collapse;
				color: Black; font-size: 16px; background-color: White;
				text-align: left; margin: 1rem 0; width: 100%;
			}
			.sort-table td, .sort-table th, .errTab2 td, .errTab2 th {
				border: solid 1px #CCCCCC; padding: 4px 6px; vertical-align: top;
			}
			.sort-table th, .errTab2 th { background-color: #DDDDDD; line-height: normal; }
			.sort-table thead { background-color: #EEEEEE; }
			nobr { white-space: nowrap; }

			ol.rules li, ul.rules li { font-size: 16px; }
			a.link, a.identifier, a:link, a:visited { text-decoration: none; color: Black; }

			.toc-list { list-style: none; padding-left: 0; font-size: 1.1rem; }
			.toc-list li { margin-bottom: 0.4rem; }

			.empty { color: #888; font-style: italic; }
			footer { margin-top: 3rem; padding-top: 1rem; border-top: 3px double #000; text-align: center; }
			footer .note { color: #935116; font-weight: 600; }
			footer .meta { color: #888; font-size: 0.85rem; }
		";

		/// <summary>
		/// Get human-readable file size.
		/// </summary>
		private string GetFileSize(string filePath)
		{
			if (!File.Exists(filePath))
				return "N/A";

			var bytes = new FileInfo(filePath).Length;
			if (bytes < 1024)
				return $"{bytes}B";
			else if (bytes < 1024 * 1024)
				return $"{bytes / 1024.0:F1}KB";
			else
				return $"{bytes / (1024.0 * 1024.0):F1}MB";
		}
	}
}
