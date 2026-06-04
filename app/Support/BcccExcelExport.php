<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\StreamedResponse;

class BcccExcelExport
{
    public static function download(string $filename, array $sheets): StreamedResponse
    {
        $safeFilename = str_ends_with(strtolower($filename), '.xls')
            ? $filename
            : preg_replace('/\.[A-Za-z0-9]+$/', '', $filename) . '.xls';

        return response()->streamDownload(function () use ($sheets): void {
            echo self::workbook($sheets);
        }, $safeFilename, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }

    public static function workbook(array $sheets): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<?mso-application progid="Excel.Sheet"?>';
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"';
        $xml .= ' xmlns:o="urn:schemas-microsoft-com:office:office"';
        $xml .= ' xmlns:x="urn:schemas-microsoft-com:office:excel"';
        $xml .= ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"';
        $xml .= ' xmlns:html="http://www.w3.org/TR/REC-html40">';
        $xml .= '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">';
        $xml .= '<Author>BCCC EASE</Author>';
        $xml .= '<Company>Baguio Convention and Cultural Center</Company>';
        $xml .= '</DocumentProperties>';
        $xml .= self::styles();

        foreach ($sheets as $sheet) {
            $xml .= self::sheet($sheet);
        }

        return $xml . '</Workbook>';
    }

    public static function section(string $title): array
    {
        return ['cells' => [$title], 'style' => 'Section'];
    }

    public static function header(array $cells): array
    {
        return ['cells' => $cells, 'style' => 'Header'];
    }

    public static function row(array $cells, string $style = 'Data'): array
    {
        return ['cells' => $cells, 'style' => $style];
    }

    private static function styles(): string
    {
        return '<Styles>'
            . '<Style ss:ID="Title"><Alignment ss:Vertical="Center" ss:WrapText="1"/>'
            . '<Font ss:Bold="1" ss:Size="18" ss:Color="#FFFFFF"/>'
            . '<Interior ss:Color="#164734" ss:Pattern="Solid"/>'
            . '<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D6B56D"/></Borders></Style>'
            . '<Style ss:ID="Subtitle"><Alignment ss:Vertical="Center" ss:WrapText="1"/>'
            . '<Font ss:Size="10" ss:Color="#5E6B62"/>'
            . '<Interior ss:Color="#FFF8E6" ss:Pattern="Solid"/></Style>'
            . '<Style ss:ID="Section"><Alignment ss:Vertical="Center"/>'
            . '<Font ss:Bold="1" ss:Size="11" ss:Color="#164734"/>'
            . '<Interior ss:Color="#F4DFAD" ss:Pattern="Solid"/>'
            . '<Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D6B56D"/>'
            . '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D6B56D"/></Borders></Style>'
            . '<Style ss:ID="Header"><Alignment ss:Vertical="Center" ss:WrapText="1"/>'
            . '<Font ss:Bold="1" ss:Size="9" ss:Color="#FFFFFF"/>'
            . '<Interior ss:Color="#226855" ss:Pattern="Solid"/>'
            . '<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#164734"/></Borders></Style>'
            . '<Style ss:ID="Data"><Alignment ss:Vertical="Top" ss:WrapText="1"/>'
            . '<Font ss:Size="9" ss:Color="#17201D"/>'
            . '<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8E1D3"/></Borders></Style>'
            . '<Style ss:ID="Muted"><Alignment ss:Vertical="Top" ss:WrapText="1"/>'
            . '<Font ss:Size="9" ss:Color="#647067"/>'
            . '<Interior ss:Color="#F8FAF9" ss:Pattern="Solid"/></Style>'
            . '<Style ss:ID="Money"><Alignment ss:Vertical="Top" ss:Horizontal="Right"/>'
            . '<Font ss:Size="9" ss:Color="#17201D"/>'
            . '<NumberFormat ss:Format="Currency"/>'
            . '<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8E1D3"/></Borders></Style>'
            . '</Styles>';
    }

    private static function sheet(array $sheet): string
    {
        $rows = $sheet['rows'] ?? [];
        $widths = $sheet['widths'] ?? [];
        $columnCount = max(
            count($widths),
            collect($rows)->map(function ($row): int {
                if (is_array($row) && array_key_exists('cells', $row)) {
                    return count((array) $row['cells']);
                }

                return is_array($row) ? count($row) : 1;
            })->max() ?: 1
        );

        $name = self::sheetName((string) ($sheet['name'] ?? 'Export'));
        $title = (string) ($sheet['title'] ?? $name);
        $subtitle = (string) ($sheet['subtitle'] ?? ('Generated ' . now()->format('F d, Y h:i A')));
        $mergeAcross = max(0, $columnCount - 1);

        $xml = '<Worksheet ss:Name="' . self::e($name) . '"><Table>';

        for ($i = 0; $i < $columnCount; $i++) {
            $width = (int) ($widths[$i] ?? 120);
            $xml .= '<Column ss:AutoFitWidth="0" ss:Width="' . $width . '"/>';
        }

        $xml .= '<Row ss:Height="30"><Cell ss:StyleID="Title" ss:MergeAcross="' . $mergeAcross . '"><Data ss:Type="String">' . self::e($title) . '</Data></Cell></Row>';
        $xml .= '<Row ss:Height="22"><Cell ss:StyleID="Subtitle" ss:MergeAcross="' . $mergeAcross . '"><Data ss:Type="String">' . self::e($subtitle) . '</Data></Cell></Row>';
        $xml .= '<Row ss:Height="8"/>';

        foreach ($rows as $row) {
            $xml .= self::rowXml($row, $columnCount);
        }

        return $xml . '</Table></Worksheet>';
    }

    private static function rowXml(mixed $row, int $columnCount): string
    {
        $style = 'Data';
        $cells = is_array($row) ? $row : [$row];

        if (is_array($row) && array_key_exists('cells', $row)) {
            $cells = (array) $row['cells'];
            $style = (string) ($row['style'] ?? 'Data');
        }

        $mergeAcross = $style === 'Section' ? max(0, $columnCount - 1) : null;
        $xml = '<Row>';

        foreach (array_values($cells) as $index => $cell) {
            $merge = $index === 0 && $mergeAcross !== null ? ' ss:MergeAcross="' . $mergeAcross . '"' : '';
            $xml .= '<Cell ss:StyleID="' . self::e($style) . '"' . $merge . '>';
            $xml .= self::dataXml($cell);
            $xml .= '</Cell>';

            if ($mergeAcross !== null) {
                break;
            }
        }

        return $xml . '</Row>';
    }

    private static function dataXml(mixed $value): string
    {
        if ($value === null || $value === '') {
            $value = '-';
        }

        if (is_int($value) || is_float($value)) {
            return '<Data ss:Type="Number">' . self::e((string) $value) . '</Data>';
        }

        return '<Data ss:Type="String">' . self::e((string) $value) . '</Data>';
    }

    private static function sheetName(string $name): string
    {
        $clean = preg_replace('/[\[\]\:\*\?\/\\\\]+/', ' ', $name) ?: 'Export';
        return substr(trim($clean) ?: 'Export', 0, 31);
    }

    private static function e(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}
