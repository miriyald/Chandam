//---------------------------------------------------------------------------------------------
// <copyright file="RSS.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:34EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using System.Web;

namespace Server
{
	public class RSS : IHttpHandler
	{
		public void ProcessRequest(HttpContext context)
		{
			context.Response.ContentType = "text/xml";
			context.Response.Write("<?xml version=\"1.0\"?>");
		}
		public bool IsReusable
		{
			get
			{
				return false;
			}
		}
	}
}
