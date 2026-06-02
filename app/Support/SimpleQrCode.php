<?php

namespace App\Support;

use InvalidArgumentException;

class SimpleQrCode
{
    private const VERSION = 5;
    private const SIZE = 37;
    private const DATA_CODEWORDS = 108;
    private const ECC_CODEWORDS = 26;
    private const FORMAT_ECL_LOW = 1;

    public static function matrix(string $text): array
    {
        $bytes = array_values(unpack('C*', $text) ?: []);
        if (count($bytes) > 106) {
            throw new InvalidArgumentException('El texto del QR supera la capacidad local configurada.');
        }

        $data = self::dataCodewords($bytes);
        $ecc = self::reedSolomonRemainder($data, self::ECC_CODEWORDS);
        $bits = self::codewordBits(array_merge($data, $ecc));

        [$modules, $isFunction] = self::functionPattern();
        self::drawCodewords($modules, $isFunction, $bits);

        $mask = self::bestMask($modules, $isFunction);
        self::applyMask($modules, $isFunction, $mask);
        self::drawFormatBits($modules, self::FORMAT_ECL_LOW, $mask);

        return $modules;
    }

    private static function dataCodewords(array $bytes): array
    {
        $bits = [];
        self::appendBits($bits, 0b0100, 4);
        self::appendBits($bits, count($bytes), 8);
        foreach ($bytes as $byte) {
            self::appendBits($bits, $byte, 8);
        }

        $capacityBits = self::DATA_CODEWORDS * 8;
        self::appendBits($bits, 0, min(4, $capacityBits - count($bits)));
        while (count($bits) % 8 !== 0) {
            $bits[] = 0;
        }

        $data = [];
        for ($i = 0; $i < count($bits); $i += 8) {
            $value = 0;
            for ($j = 0; $j < 8; $j++) {
                $value = ($value << 1) | $bits[$i + $j];
            }
            $data[] = $value;
        }

        for ($pad = 0xEC; count($data) < self::DATA_CODEWORDS; $pad ^= 0xFD) {
            $data[] = $pad;
        }

        return $data;
    }

    private static function appendBits(array &$bits, int $value, int $length): void
    {
        for ($i = $length - 1; $i >= 0; $i--) {
            $bits[] = ($value >> $i) & 1;
        }
    }

    private static function codewordBits(array $codewords): array
    {
        $bits = [];
        foreach ($codewords as $codeword) {
            self::appendBits($bits, $codeword, 8);
        }

        return $bits;
    }

    private static function functionPattern(): array
    {
        $modules = array_fill(0, self::SIZE, array_fill(0, self::SIZE, false));
        $isFunction = array_fill(0, self::SIZE, array_fill(0, self::SIZE, false));

        self::drawFinder($modules, $isFunction, 3, 3);
        self::drawFinder($modules, $isFunction, self::SIZE - 4, 3);
        self::drawFinder($modules, $isFunction, 3, self::SIZE - 4);
        self::drawAlignment($modules, $isFunction, 30, 30);

        for ($i = 8; $i < self::SIZE - 8; $i++) {
            self::setFunction($modules, $isFunction, 6, $i, $i % 2 === 0);
            self::setFunction($modules, $isFunction, $i, 6, $i % 2 === 0);
        }

        self::reserveFormatBits($isFunction);
        self::drawFormatBits($modules, self::FORMAT_ECL_LOW, 0);
        self::setFunction($modules, $isFunction, 8, self::SIZE - 8, true);

        return [$modules, $isFunction];
    }

    private static function reserveFormatBits(array &$isFunction): void
    {
        for ($i = 0; $i <= 5; $i++) {
            $isFunction[$i][8] = true;
        }
        $isFunction[7][8] = true;
        $isFunction[8][8] = true;
        $isFunction[8][7] = true;
        for ($i = 9; $i < 15; $i++) {
            $isFunction[8][14 - $i] = true;
        }

        for ($i = 0; $i < 8; $i++) {
            $isFunction[8][self::SIZE - 1 - $i] = true;
        }
        for ($i = 8; $i < 15; $i++) {
            $isFunction[self::SIZE - 15 + $i][8] = true;
        }
    }

    private static function drawFinder(array &$modules, array &$isFunction, int $centerX, int $centerY): void
    {
        for ($dy = -4; $dy <= 4; $dy++) {
            for ($dx = -4; $dx <= 4; $dx++) {
                $x = $centerX + $dx;
                $y = $centerY + $dy;
                if ($x < 0 || $x >= self::SIZE || $y < 0 || $y >= self::SIZE) {
                    continue;
                }

                $distance = max(abs($dx), abs($dy));
                self::setFunction($modules, $isFunction, $x, $y, $distance !== 2 && $distance !== 4);
            }
        }
    }

    private static function drawAlignment(array &$modules, array &$isFunction, int $centerX, int $centerY): void
    {
        for ($dy = -2; $dy <= 2; $dy++) {
            for ($dx = -2; $dx <= 2; $dx++) {
                $distance = max(abs($dx), abs($dy));
                self::setFunction($modules, $isFunction, $centerX + $dx, $centerY + $dy, $distance !== 1);
            }
        }
    }

    private static function setFunction(array &$modules, array &$isFunction, int $x, int $y, bool $dark): void
    {
        $modules[$y][$x] = $dark;
        $isFunction[$y][$x] = true;
    }

    private static function drawCodewords(array &$modules, array $isFunction, array $bits): void
    {
        $bitIndex = 0;
        $upward = true;
        for ($right = self::SIZE - 1; $right >= 1; $right -= 2) {
            if ($right === 6) {
                $right = 5;
            }

            for ($vertical = 0; $vertical < self::SIZE; $vertical++) {
                $y = $upward ? self::SIZE - 1 - $vertical : $vertical;
                for ($column = 0; $column < 2; $column++) {
                    $x = $right - $column;
                    if ($isFunction[$y][$x]) {
                        continue;
                    }

                    $modules[$y][$x] = ($bits[$bitIndex] ?? 0) === 1;
                    $bitIndex++;
                }
            }

            $upward = !$upward;
        }
    }

    private static function bestMask(array $modules, array $isFunction): int
    {
        $bestMask = 0;
        $bestPenalty = PHP_INT_MAX;
        for ($mask = 0; $mask < 8; $mask++) {
            $test = $modules;
            self::applyMask($test, $isFunction, $mask);
            self::drawFormatBits($test, self::FORMAT_ECL_LOW, $mask);
            $penalty = self::penaltyScore($test);
            if ($penalty < $bestPenalty) {
                $bestPenalty = $penalty;
                $bestMask = $mask;
            }
        }

        return $bestMask;
    }

    private static function applyMask(array &$modules, array $isFunction, int $mask): void
    {
        for ($y = 0; $y < self::SIZE; $y++) {
            for ($x = 0; $x < self::SIZE; $x++) {
                if (!$isFunction[$y][$x] && self::maskBit($mask, $x, $y)) {
                    $modules[$y][$x] = !$modules[$y][$x];
                }
            }
        }
    }

    private static function maskBit(int $mask, int $x, int $y): bool
    {
        return match ($mask) {
            0 => (($x + $y) % 2) === 0,
            1 => ($y % 2) === 0,
            2 => ($x % 3) === 0,
            3 => (($x + $y) % 3) === 0,
            4 => ((intdiv($y, 2) + intdiv($x, 3)) % 2) === 0,
            5 => (($x * $y) % 2 + ($x * $y) % 3) === 0,
            6 => ((($x * $y) % 2 + ($x * $y) % 3) % 2) === 0,
            7 => ((($x + $y) % 2 + ($x * $y) % 3) % 2) === 0,
            default => false,
        };
    }

    private static function drawFormatBits(array &$modules, int $ecl, int $mask): void
    {
        $data = ($ecl << 3) | $mask;
        $remainder = $data;
        for ($i = 0; $i < 10; $i++) {
            $remainder = ($remainder << 1) ^ ((($remainder >> 9) & 1) ? 0x537 : 0);
        }
        $bits = (($data << 10) | $remainder) ^ 0x5412;

        for ($i = 0; $i <= 5; $i++) {
            $modules[$i][8] = (($bits >> $i) & 1) !== 0;
        }
        $modules[7][8] = (($bits >> 6) & 1) !== 0;
        $modules[8][8] = (($bits >> 7) & 1) !== 0;
        $modules[8][7] = (($bits >> 8) & 1) !== 0;
        for ($i = 9; $i < 15; $i++) {
            $modules[8][14 - $i] = (($bits >> $i) & 1) !== 0;
        }

        for ($i = 0; $i < 8; $i++) {
            $modules[8][self::SIZE - 1 - $i] = (($bits >> $i) & 1) !== 0;
        }
        for ($i = 8; $i < 15; $i++) {
            $modules[self::SIZE - 15 + $i][8] = (($bits >> $i) & 1) !== 0;
        }
        $modules[self::SIZE - 8][8] = true;
    }

    private static function reedSolomonRemainder(array $data, int $degree): array
    {
        $generator = self::reedSolomonGenerator($degree);
        $result = array_fill(0, $degree, 0);

        foreach ($data as $byte) {
            $factor = $byte ^ array_shift($result);
            $result[] = 0;
            for ($i = 0; $i < $degree; $i++) {
                $result[$i] ^= self::gfMultiply($generator[$i], $factor);
            }
        }

        return $result;
    }

    private static function reedSolomonGenerator(int $degree): array
    {
        $result = [1];
        $root = 1;
        for ($i = 0; $i < $degree; $i++) {
            $next = array_fill(0, count($result) + 1, 0);
            for ($j = 0; $j < count($result); $j++) {
                $next[$j] ^= self::gfMultiply($result[$j], $root);
                $next[$j + 1] ^= $result[$j];
            }
            $result = $next;
            $root = self::gfMultiply($root, 0x02);
        }

        array_shift($result);
        return $result;
    }

    private static function gfMultiply(int $x, int $y): int
    {
        $result = 0;
        for ($i = 7; $i >= 0; $i--) {
            $result = (($result << 1) ^ (($result & 0x80) ? 0x11D : 0)) & 0xFF;
            if (($y >> $i) & 1) {
                $result ^= $x;
            }
        }

        return $result;
    }

    private static function penaltyScore(array $modules): int
    {
        $result = 0;

        for ($y = 0; $y < self::SIZE; $y++) {
            $runColor = false;
            $runLength = 0;
            for ($x = 0; $x < self::SIZE; $x++) {
                if ($x === 0 || $modules[$y][$x] !== $runColor) {
                    if ($runLength >= 5) {
                        $result += 3 + ($runLength - 5);
                    }
                    $runColor = $modules[$y][$x];
                    $runLength = 1;
                } else {
                    $runLength++;
                }
            }
            if ($runLength >= 5) {
                $result += 3 + ($runLength - 5);
            }
        }

        for ($x = 0; $x < self::SIZE; $x++) {
            $runColor = false;
            $runLength = 0;
            for ($y = 0; $y < self::SIZE; $y++) {
                if ($y === 0 || $modules[$y][$x] !== $runColor) {
                    if ($runLength >= 5) {
                        $result += 3 + ($runLength - 5);
                    }
                    $runColor = $modules[$y][$x];
                    $runLength = 1;
                } else {
                    $runLength++;
                }
            }
            if ($runLength >= 5) {
                $result += 3 + ($runLength - 5);
            }
        }

        for ($y = 0; $y < self::SIZE - 1; $y++) {
            for ($x = 0; $x < self::SIZE - 1; $x++) {
                $color = $modules[$y][$x];
                if ($color === $modules[$y][$x + 1] && $color === $modules[$y + 1][$x] && $color === $modules[$y + 1][$x + 1]) {
                    $result += 3;
                }
            }
        }

        $dark = 0;
        foreach ($modules as $row) {
            foreach ($row as $module) {
                if ($module) {
                    $dark++;
                }
            }
        }
        $total = self::SIZE * self::SIZE;
        $result += (int) (abs($dark * 20 - $total * 10) / $total) * 10;

        return $result;
    }
}
