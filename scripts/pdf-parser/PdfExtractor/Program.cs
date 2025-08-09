
using iText.Kernel.Pdf;
using iText.Kernel.Utils;
using System.Xml;

class Program
{
    static void Main(string[] args)
    {
        // var sourceDocPath = "C:/_/aeon/fvtt-system-draw-steel/Draw_Steel_Monsters_v1.pdf";

        // using var pdf = new PdfDocument(new PdfReader(sourceDocPath));
        // var root = pdf.GetStructTreeRoot();
        // if (root == null) { Console.WriteLine("No tag tree."); return; }
        // var tool = new TaggedPdfReaderTool(pdf);

        // using var fs = File.Create("C:/_/aeon/fvtt-system-draw-steel/accessible.xml");   // or .html via ConvertToHtml
        // tool.ConvertToXml(fs);
        Format();
    }

    static void Format()
    {
        var readerSettings = new XmlReaderSettings
        {
            IgnoreWhitespace = true,  // Ignore existing insignificant whitespace
            IgnoreComments = false
        };

        var writerSettings = new XmlWriterSettings
        {
            Indent = true,               // Enable indentation
            IndentChars = "  ",          // Two spaces
            NewLineChars = "\n",         // Unix-style line endings
            NewLineHandling = NewLineHandling.Replace,
            Encoding = System.Text.Encoding.UTF8,
            OmitXmlDeclaration = false   // Keep XML declaration
        };

        using var r = XmlReader.Create("C:/_/aeon/fvtt-system-draw-steel/accessible-9.xml", readerSettings);
        using var w = XmlWriter.Create("C:/_/aeon/fvtt-system-draw-steel/accessible-formatted-9.xml", writerSettings);
        
        w.WriteNode(r, false);
    }

}