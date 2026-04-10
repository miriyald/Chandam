//---------------------------------------------------------------------------------------------
// <copyright file="Page.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:26EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using MiriyamApp;
using System;
using System.Html;

namespace MiriyamAPI
{
	[ScriptModule]
	internal static class Page
	{
		static Page()
		{
			if (Window.Location.Href.ToString().IndexOf("http://") == -1)
			{
				Document.GetElementById("body").InnerHTML = "<h2>I don't encourage this. If you are really interested in source code please write to me or can try Chandam API.</h2>";
				return;
			}
			Worker.Init();
		}
	}
}